import { getLogger } from 'log4js';
import mqtt, { MqttClient } from 'mqtt';
import {
  BaseUnit,
  BaseUnitState,
  ContactId,
  ContactIDEventCategory,
  ContactIDEventQualifier,
  Device,
  DeviceEventCode,
  DeviceType,
  ESFlags,
  IntEnum,
  OperationMode,
  PropertyChangedInfo,
} from 'nodesos';
import { sprintf } from 'sprintf-js';
import { BaseUnitConfig, Config, DeviceConfig } from './index';
import Subscription from './Subscription';
import SubscriptionMap from './SubscriptionMap';
import { availabilityInfo, deviceInfo } from './utils';

const logger = getLogger('NodeSOSMQTT');

const AUTO_RESET_INTERVAL = 180;

const enabledStatuses = {
  c: ['Delay', 'AlarmSiren', 'Latchkey'] satisfies Partial<keyof typeof ESFlags>[],
  b: [
    'Bypass',
    'Delay',
    'Hour24',
    'HomeGuard',
    'PreWarning',
    'AlarmSiren',
    'Bell',
    'Inactivity',
    'HomeAuto',
  ] satisfies Partial<keyof typeof ESFlags>[],
  f: ['Bypass', 'WarningBeepDelay', 'AlarmSiren'] satisfies Partial<keyof typeof ESFlags>[],
  m: ['Bypass', 'WarningBeepDelay', 'AlarmSiren'] satisfies Partial<keyof typeof ESFlags>[],
};

class NodeSOSMqttAdapter {
  private readonly baseunit: BaseUnit;
  private readonly config: Config;
  private readonly mqtt: MqttClient;

  private ha_state?: string;
  private state?: number;

  private subscriptions = new SubscriptionMap();
  private deviceSubscriptions = new SubscriptionMap();
  private autoResetHandlers = new Map<number, NodeJS.Timeout>();

  constructor(config: Config) {
    this.config = config;

    this.baseunit = new BaseUnit(this.config.lifesos.port, this.config.lifesos.host);
    if (this.config.lifesos.password) {
      this.baseunit.password = this.config.lifesos.password;
    }

    this.baseunitDeviceAdded = this.baseunitDeviceAdded.bind(this);
    this.baseunitDeviceDeleted = this.baseunitDeviceDeleted.bind(this);
    this.baseunitEvent = this.baseunitEvent.bind(this);
    this.baseunitPropertiesChanged = this.baseunitPropertiesChanged.bind(this);

    this.deviceOnEvent = this.deviceOnEvent.bind(this);
    this.deviceOnPropertiesChanged = this.deviceOnPropertiesChanged.bind(this);

    this.onMessageClearStatus = this.onMessageClearStatus.bind(this);
    this.onBaseUnitMessage = this.onBaseUnitMessage.bind(this);
    this.onBirthMessage = this.onBirthMessage.bind(this);
    this.onEnabledStatusMessage = this.onEnabledStatusMessage.bind(this);

    this.baseunit.onDeviceAdded = this.baseunitDeviceAdded;
    this.baseunit.onDeviceDeleted = this.baseunitDeviceDeleted;
    this.baseunit.onEvent = this.baseunitEvent;
    this.baseunit.onPropertiesChanged = this.baseunitPropertiesChanged;

    this.mqtt = mqtt.connect(this.config.mqtt.uri, {
      clientId: this.config.mqtt.client_id,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
      manualConnect: true,
      will: {
        topic: `${this.config.adapter.baseunit.topic}/is_connected`,
        payload: Buffer.from(String(false), 'utf-8'),
        qos: 1,
        retain: true,
      },
    });

    this.subscriptions.add(
      new Subscription(`${this.config.adapter.baseunit.topic}/clear_status`, this.onMessageClearStatus),
    );

    this.subscriptions.add(
      new Subscription(`${this.config.adapter.baseunit.topic}/operation_mode/set`, this.onBaseUnitMessage),
    );

    this.subscriptions.add(new Subscription(this.config.adapter.birth_topic, this.onBirthMessage));

    // Subscribe to topics.
    this.subscriptions.forEach((subscription) => {
      this.mqtt.subscribe(subscription.topic, { qos: 1 });
    });
  }

  /**
   * Starts up the LifeSOS interface and connects to MQTT broker.
   */
  async start() {
    return new Promise<void>((resolve, reject) => {
      this.mqtt.connect();

      this.mqtt.once('connect', () => {
        this.baseunit
          .start()
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });

      this.mqtt.on('connect', () => {
        logger.info('MQTT Client connected to broker');
        this.onMqttConnect();
      });

      this.mqtt.on('reconnect', () => {
        logger.info('MQTT Client reconnecting to broker....');
      });

      this.mqtt.on('close', () => {
        logger.info('MQTT Client disconnected from broker');
      });

      this.mqtt.on('error', (error) => {
        logger.error('MQTT Client error', error.message);
      });

      this.mqtt.on('message', (topic, message) => {
        logger.debug('MQTT Client got message', topic, message.toString());

        const subscription = this.subscriptions.get(topic);
        if (subscription) {
          subscription.onMessage(subscription, message.toString());
        }

        const deviceSubscription = this.deviceSubscriptions.get(topic);
        if (deviceSubscription) {
          deviceSubscription.onMessage(deviceSubscription, message.toString());
        }
      });
    });
  }

  async stop() {
    await this.baseunit.stop().catch(() => {
      logger.error('Error stopping base unit');
    });
    logger.info('Baseunit stopped');

    if (this.mqtt.connected || this.mqtt.reconnecting) {
      if (this.mqtt.connected) {
        this.publish(`${this.config.adapter.baseunit.topic}/is_connected`, String(false), true);
      }

      await this.mqtt.endAsync().catch(() => {
        logger.error('Error ending MQTT Client');
      });
      logger.info('MQTT client stopped');
    }
  }

  private async onMqttConnect() {
    // Announce availability to the availability_topic on MQTT reconnect.
    this.publish(`${this.config.adapter.baseunit.topic}/is_connected`, String(this.baseunit.isConnected), true);
  }

  private baseunitDeviceAdded(device: Device) {
    // Hook up callbacks for device that was added / discovered
    device.onEvent = this.deviceOnEvent;
    device.onPropertiesChanged = this.deviceOnPropertiesChanged;

    // Get configuration settings for device; don't go any further when
    // device is not included in the config.
    const deviceConfig = this.config.adapter.devices.find((i) => i.id === device.deviceId.toString(16));
    if (!deviceConfig) {
      logger.info(
        `Ignoring device as it was not listed in the config file: ${device.deviceId.toString(16)} ${
          device.type?.string
        }`,
      );
      return;
    }

    // Publish state
    this.publishDeviceProperty(deviceConfig.topic, device, 'isClosed', device.isClosed);

    // Publish RSSI
    this.publishDeviceProperty(deviceConfig.topic, device, 'rssiDb', device.rssiDb);

    // Publish enableStatus
    this.publishDeviceProperty(deviceConfig.topic, device, 'enableStatus', device.enableStatus);

    for (const statusName of enabledStatuses[device.category.code as keyof typeof enabledStatuses]) {
      const topic = `${deviceConfig.topic}/enabled_status/${statusName}/set`;

      // Subscribe to changes
      this.deviceSubscriptions.add(
        new Subscription(topic, this.onEnabledStatusMessage, { device, status: ESFlags[statusName] }),
      );

      this.mqtt.subscribe(topic, { qos: 1 });
    }

    this.publishDeviceDiscoveryMessage(device, deviceConfig);
    this.publishDeviceRSSIDiscoveryMessage(device, deviceConfig);
    this.publishDeviceBatteryDiscoveryMessage(device, deviceConfig);
    this.publishDeviceEnableStatusDiscoveryMessage(device, deviceConfig);

    this.publish(
      `${deviceConfig.topic}/attributes`,
      JSON.stringify({
        ID: device.deviceId.toString(16),
        Category: device.category.description,
        Characteristics: device.characteristics.string?.split('|').join(' | '),
        Type: device.type!.string,
        Zone: device.zone,
      }),
      false,
    );
  }

  private baseunitDeviceDeleted(device: Device) {
    // Remove callbacks from deleted device
    device.onEvent = undefined;
    device.onPropertiesChanged = undefined;
  }

  private baseunitEvent(contactId: ContactId) {
    if (
      contactId.eventQualifier.value === ContactIDEventQualifier.Event &&
      contactId.eventCategory.value === ContactIDEventCategory.Alarm
    ) {
      this.ha_state = 'triggered';
      this.publish(`${this.config.adapter.baseunit.topic}/ha_state`, this.ha_state, true);
    }
  }

  private baseunitPropertiesChanged(change: PropertyChangedInfo) {
    logger.debug(`Base unit prop change: ${change.name} - ${change.oldValue} -> ${change.newValue}`);
    this.publishBaseunitProperty(change.name, change.newValue);

    if (change.name === 'isConnected' && change.newValue) {
      this.publishHomeAssistantDiscoveryMessages();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private publishBaseunitProperty(name: string, value: any) {
    if (name === 'state') {
      this.state = value;

      const topic = `${this.config.adapter.baseunit.topic}/ha_state`;
      if ([BaseUnitState.Disarm, BaseUnitState.Monitor].includes(value)) {
        this.ha_state = 'disarmed';
        this.publish(topic, this.ha_state, true);
      } else if (value === BaseUnitState.Home) {
        this.ha_state = 'armed_home';
        this.publish(topic, this.ha_state, true);
      } else if (value === BaseUnitState.Away) {
        this.ha_state = 'armed_away';
        this.publish(topic, this.ha_state, true);
      } else if ([BaseUnitState.AwayExitDelay, BaseUnitState.AwayEntryDelay].includes(value)) {
        this.ha_state = 'pending';
        this.publish(topic, this.ha_state, true);
      }
    } else if (['isConnected'].includes(name)) {
      this.publish(`${this.config.adapter.baseunit.topic}/is_connected`, String(value), true);
    }
  }

  private deviceOnEvent(device: Device, eventCode: DeviceEventCode) {
    const deviceConfig = this.config.adapter.devices.find((i) => i.id === device.deviceId.toString(16));
    if (!deviceConfig) {
      return;
    }

    if ([DeviceEventCode.BatteryLow as number, DeviceEventCode.PowerOnReset as number].includes(eventCode)) {
      this.publish(`${deviceConfig.topic}/battery`, new IntEnum(DeviceEventCode, eventCode).string, true);
    }

    // When it is a Trigger event, set state to On and schedule an
    // auto reset callback to occur after specified interval
    if (eventCode === DeviceEventCode.Trigger) {
      this.publish(deviceConfig.topic, 'On', true);

      const autoResetHandler = this.autoResetHandlers.get(device.deviceId);
      if (autoResetHandler) {
        clearTimeout(autoResetHandler);
      }

      this.autoResetHandlers.set(
        device.deviceId,
        setTimeout(() => {
          this.publish(deviceConfig.topic, 'Off', true);
          this.autoResetHandlers.delete(device.deviceId);
        }, AUTO_RESET_INTERVAL * 1000),
      );
    }
  }

  private deviceOnPropertiesChanged(device: Device, change: PropertyChangedInfo) {
    const deviceConfig = this.config.adapter.devices.find((i) => i.id === device.deviceId.toString(16));
    if (!deviceConfig) {
      return;
    }

    logger.debug(`Device prop change: ${change.name}`, change.oldValue, change.newValue);

    this.publishDeviceProperty(deviceConfig.topic, device, change.name, change.newValue);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private publishDeviceProperty(topic: string, device: Device, name: string, value: any) {
    // Device topic holds the state
    if (name === 'isClosed') {
      // For regular device; this is the Is Closed property for magnet sensors, otherwise default to Off for trigger-based devices
      if (device.type?.value === DeviceType.DoorMagnet) {
        this.publish(topic, value ? 'Closed' : 'Open', true);
      } else {
        this.publish(topic, 'Off', true);
      }
    } else if (name === 'rssiDb') {
      this.publish(`${topic}/${name}`, String(value), true);
    } else if (name === 'enableStatus') {
      for (const statusName of enabledStatuses[device.category.code as keyof typeof enabledStatuses]) {
        const isEnabled = Boolean(value.value & ESFlags[statusName as keyof typeof ESFlags]);
        this.publish(`${topic}/enabled_status/${statusName}`, String(isEnabled), true);
      }
    }
  }

  private publishBaseunitDiscoveryMessage(config: BaseUnitConfig) {
    const message = {
      default_entity_id: 'lifesos_baseunit',
      unique_id: 'lifesos_baseunit',
      state_topic: `${config.topic}/ha_state`,
      command_topic: `${config.topic}/operation_mode/set`,
      payload_disarm: 'Disarm',
      payload_arm_home: 'Home',
      code_arm_required: String(false),
      code_disarm_required: String(false),
      code_trigger_required: String(false),
      payload_arm_away: 'Away',
      ...availabilityInfo(config.topic),
      supported_features: ['trigger', 'arm_home', 'arm_away'],
      ...deviceInfo('lifesos_baseunit', config),
    };

    this.publish(
      sprintf('%s/%s/%s/config', this.config.adapter.discovery_prefix, 'alarm_control_panel', message['unique_id']),
      JSON.stringify(message),
      false,
    );
  }

  private publishBaseunitClearAlarmEventsDiscoveryMessage(config: BaseUnitConfig) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message: any = {
      name: 'Clear alarm events',
      default_entity_id: 'lifesos_clear_events',
      unique_id: 'lifesos_clear_events',
      icon: 'mdi:notification-clear-all',
      command_topic: `${config.topic}/clear_status`,
      ...availabilityInfo(config.topic),
      ...deviceInfo('lifesos_baseunit', config),
    };

    if (this.config.lifesos.password) {
      message.payload_press = this.config.lifesos.password;
    }

    this.publish(
      sprintf('%s/%s/%s/config', this.config.adapter.discovery_prefix, 'button', message['unique_id']),
      JSON.stringify(message),
      false,
    );
  }

  private publishDeviceDiscoveryMessage(device: Device, config: DeviceConfig) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message: any = {
      default_entity_id: sprintf('lifesos_%06x', device.deviceId),
      unique_id: sprintf('lifesos_%06x', device.deviceId),
      state_topic: config.topic,
      ...availabilityInfo(this.config.adapter.baseunit.topic),
      json_attributes_topic: `${config.topic}/attributes`,
      ...deviceInfo(sprintf('lifesos_%06x', device.deviceId), config),
    };

    if (device.type?.value === DeviceType.SmokeDetector) {
      message.device_class = 'smoke';
      message.payload_on = 'On';
      message.payload_off = 'Off';
    } else if (device.type?.value === DeviceType.DoorMagnet) {
      message.device_class = 'door';
      message.payload_on = 'Open';
      message.payload_off = 'Closed';
    } else if (device.type?.value === DeviceType.PIRSensor) {
      message.device_class = 'motion';
      message.payload_on = 'On';
      message.payload_off = 'Off';
    } else {
      logger.warn(`Device type '${device.type?.string}' cannot be represented in Home Assistant and will be skipped`);
      return;
    }

    this.publish(
      sprintf('%s/%s/%s/config', this.config.adapter.discovery_prefix, 'binary_sensor', message.unique_id),
      JSON.stringify(message),
      false,
    );
  }

  private publishDeviceEnableStatusDiscoveryMessage(device: Device, config: DeviceConfig) {
    for (const statusName of enabledStatuses[device.category.code as keyof typeof enabledStatuses]) {
      const message = {
        name: statusName,
        default_entity_id: sprintf('lifesos_%06x_es_%s', device.deviceId, statusName.toLowerCase()),
        unique_id: sprintf('lifesos_%06x_es_%s', device.deviceId, statusName.toLowerCase()),
        state_topic: `${config.topic}/enabled_status/${statusName}`,
        command_topic: `${config.topic}/enabled_status/${statusName}/set`,
        payload_on: String(true),
        payload_off: String(false),
        ...availabilityInfo(this.config.adapter.baseunit.topic),
        entity_category: 'config',
        ...deviceInfo(sprintf('lifesos_%06x', device.deviceId), config),
      };

      this.publish(
        sprintf('%s/%s/%s/config', this.config.adapter.discovery_prefix, 'switch', message.unique_id),
        JSON.stringify(message),
        false,
      );
    }
  }

  private publishDeviceRSSIDiscoveryMessage(device: Device, config: DeviceConfig) {
    const message = {
      default_entity_id: sprintf('lifesos_%06x_rssi', device.deviceId),
      unique_id: sprintf('lifesos_%06x_rssi', device.deviceId),
      icon: 'mdi:wifi',
      state_topic: `${config.topic}/rssiDb`,
      device_class: 'signal_strength',
      unit_of_measurement: 'dB',
      ...availabilityInfo(this.config.adapter.baseunit.topic),
      entity_category: 'diagnostic',
      ...deviceInfo(sprintf('lifesos_%06x', device.deviceId), config),
    };

    this.publish(
      sprintf('%s/%s/%s/config', this.config.adapter.discovery_prefix, 'sensor', message.unique_id),
      JSON.stringify(message),
      false,
    );
  }

  private publishDeviceBatteryDiscoveryMessage(device: Device, config: DeviceConfig) {
    const message = {
      default_entity_id: sprintf('lifesos_%06x_battery', device.deviceId),
      unique_id: sprintf('lifesos_%06x_battery', device.deviceId),
      device_class: 'battery',
      payload_on: 'BatteryLow',
      payload_off: 'PowerOnReset',
      state_topic: `${config.topic}/battery`,
      ...availabilityInfo(this.config.adapter.baseunit.topic),
      entity_category: 'diagnostic',
      ...deviceInfo(sprintf('lifesos_%06x', device.deviceId), config),
    };

    this.publish(
      sprintf('%s/%s/%s/config', this.config.adapter.discovery_prefix, 'binary_sensor', message.unique_id),
      JSON.stringify(message),
      false,
    );
  }

  private publish(topic: string, payload: string, retain: boolean) {
    if (!this.mqtt.connected) {
      logger.error('Publish called but there are no MQTT connection', topic, payload);
      return;
    }

    this.mqtt.publishAsync(topic, payload, { qos: 1, retain }).catch((error) => {
      logger.error('Error publishing', topic, payload, error);
    });
  }

  private publishHomeAssistantDiscoveryMessages() {
    this.publishBaseunitDiscoveryMessage(this.config.adapter.baseunit);
    this.publishBaseunitClearAlarmEventsDiscoveryMessage(this.config.adapter.baseunit);

    for (const deviceConfig of this.config.adapter.devices) {
      const device = this.baseunit.devices.get(parseInt(deviceConfig.id, 16));

      if (device) {
        this.publishDeviceDiscoveryMessage(device, deviceConfig);
        this.publishDeviceRSSIDiscoveryMessage(device, deviceConfig);
        this.publishDeviceBatteryDiscoveryMessage(device, deviceConfig);
        this.publishDeviceEnableStatusDiscoveryMessage(device, deviceConfig);
      }
    }
  }

  private onBaseUnitMessage(subscription: Subscription, message: string) {
    const opMode = OperationMode[message as keyof typeof OperationMode];

    if (opMode === undefined) {
      logger.warn(`Cannot set operation_mode to '${message}'`);
      return;
    }

    // Special case to ensure HA can return from triggered state when triggered
    // by an alarm in Disarm mode (e.g. panic, tamper)... the set disarm
    // operation will not generate a response from the base unit as there is no
    // change, so we need to reset 'ha_state' here.
    if (
      opMode === (OperationMode.Disarm as number) &&
      this.ha_state === 'triggered' &&
      this.state === BaseUnitState.Disarm
    ) {
      logger.debug('Resetting triggered ha_state in disarmed mode');
      this.ha_state = 'disarmed';
      this.publish(`${this.config.adapter.baseunit.topic}/ha_state`, this.ha_state, true);
    }

    logger.debug(`Set operation mode to '${message}' (${opMode})`);
    this.baseunit
      .setOperationMode(opMode)
      .then(() => {
        logger.info(`Task: SetOperationMode -> '${message}' (${opMode}) executed successfully`);
      })
      .catch((error) => {
        logger.error('Error setOperationMode:', error);
      });
  }

  private onMessageClearStatus(subscription: Subscription, message: string) {
    // Clear the alarm/warning LEDs on base unit and stop siren
    this.baseunit
      .clearStatus(message)
      .then(() => {
        logger.info('Task: ClearStatus executed successfully');
      })
      .catch((error) => {
        logger.error('Error clearStatus:', error);
      });
  }

  private onBirthMessage(subscription: Subscription, message: string) {
    // When Home Assistant comes online, publish our configuration to it
    if (message === this.config.adapter.birth_payload) {
      this.publishHomeAssistantDiscoveryMessages();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async onEnabledStatusMessage(subscription: Subscription, message: string) {
    const device: Device = subscription.args.device;

    await this.baseunit
      .changeDevice(
        device.deviceId,
        device.groupNumber,
        device.unitNumber,
        device.enableStatus.value ^ subscription.args.status,
      )
      .catch((error) => {
        logger.error('Failed to change device', error);
      });
  }
}

export default NodeSOSMqttAdapter;
