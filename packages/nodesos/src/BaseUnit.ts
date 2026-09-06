import * as log4js from 'log4js';
import { DateTime } from 'luxon';
import { sprintf } from 'sprintf-js';
import Client from './Client';
import Command from './Command';
import AddDeviceCommand from './Commands/AddDeviceCommand';
import ChangeDeviceCommand from './Commands/ChangeDeviceCommand';
import ClearStatusCommand from './Commands/ClearStatusCommand';
import DeleteDeviceCommand from './Commands/DeleteDeviceCommand';
import GetDateTimeCommand from './Commands/GetDateTimeCommand';
import GetDeviceByIndexCommand from './Commands/GetDeviceByIndexCommand';
import GetDeviceCommand from './Commands/GetDeviceCommand';
import GetEntryDelayCommand from './Commands/GetEntryDelayCommand';
import GetEventLogCommand from './Commands/GetEventLogCommand';
import GetExitDelayCommand from './Commands/GetExitDelayCommand';
import GetOpModeCommand from './Commands/GetOpModeCommand';
import GetROMVersionCommand from './Commands/GetROMVersionCommand';
import SetDateTimeCommand from './Commands/SetDateTimeCommand';
import SetOpModeCommand from './Commands/SetOpModeCommand';
import ContactId from './ContactId';
import Device from './Device';
import DeviceCategory, { DC_ALL, DC_BURGLAR, DC_CONTROLLER } from './DeviceCategory';
import DeviceEvent from './DeviceEvent';
import {
  BaseUnitState,
  ContactIDEventCategory,
  ContactIDEventCode,
  ContactIDEventQualifier,
  DeviceEventCode,
  ESFlags,
  IntEnum,
  OperationMode,
} from './Enums';
import PropertyChangedInfo from './PropertyChangedInfo';
import Response from './Response';
import DateTimeResponse from './Responses/DateTimeResponse';
import DeviceAddedResponse from './Responses/DeviceAddedResponse';
import DeviceDeletedResponse from './Responses/DeviceDeletedResponse';
import DeviceInfoResponse from './Responses/DeviceInfoResponse';
import DeviceNotFoundResponse from './Responses/DeviceNotFoundResponse';
import DeviceSettingsResponse from './Responses/DeviceSettingsResponse';
import EntryDelayResponse from './Responses/EntryDelayResponse';
import EventLogNotFoundResponse from './Responses/EventLogNotFoundResponse';
import EventLogResponse from './Responses/EventLogResponse';
import ExitDelayResponse from './Responses/ExitDelayResponse';
import OpModeResponse from './Responses/OpModeResponse';
import ROMVersionResponse from './Responses/ROMVersionResponse';

const logger = log4js.getLogger('NodeSOS.BaseUnit');

/**
 * Represents the base unit.
 *
 * Provides all management of the LifeSOS alarm system, monitoring attached
 * devices, events, and is used to issue commands. When running as a client,
 * it will also attempt reconnection automatically on failure.
 *
 * Your application can use the Client or Server class for direct access
 * to LifeSOS, or alternatively use the BaseUnit class to provide management
 * and higher level access.
 */
export class BaseUnit {
  // Allow this many retries when getting initial state
  static RETRY_MAX = 3;

  // Default TCP port for LifeSOS communication
  static TCP_PORT = 1680;

  private _entryDelay?: number;
  private _exitDelay?: number;
  private _isConnected: boolean = false;
  private _operationMode?: IntEnum<typeof OperationMode>;
  private _ROMVersion?: string;
  private _state?: number;

  readonly protocol: Client;

  /**
   * Collection of devices enrolled on the base unit
   */
  devices = new Map<number, Device>();

  /**
   * Called after a device has been discovered or added.
   */
  onDeviceAdded?: (device: Device) => void;

  /**
   * Called after a device has been deleted.
   */
  onDeviceDeleted?: (device: Device) => void;

  /**
   * Called when an event occurs.
   */
  onEvent?: (contactId: ContactId) => void;

  /**
   * Called after property values have been changed.
   */
  onPropertiesChanged?: (changedProp: PropertyChangedInfo) => void;

  /**
   * Initializes an instance of the BaseUnit class
   *
   * @param port port number to connect to.
   * @param host host name or IP address for the LifeSOS server.
   */
  constructor(port: number = BaseUnit.TCP_PORT, host?: string) {
    this.protocol = new Client(port, host);

    this.handleConnectionMade = this.handleConnectionMade.bind(this);
    this.handleConnectionClose = this.handleConnectionClose.bind(this);
    this.handleConnectionError = this.handleConnectionError.bind(this);
    this.handleContactId = this.handleContactId.bind(this);
    this.handleDeviceEvent = this.handleDeviceEvent.bind(this);
    this.handleResponse = this.handleResponse.bind(this);

    // Assign callbacks to capture all events
    this.protocol.onConnectionMade = this.handleConnectionMade;
    this.protocol.onConnectionClose = this.handleConnectionClose;
    this.protocol.onConnectionError = this.handleConnectionError;
    this.protocol.onContactId = this.handleContactId;
    this.protocol.onDeviceEvent = this.handleDeviceEvent;
    this.protocol.onResponse = this.handleResponse;
  }

  /**
   * Entry delay, in seconds.
   */
  get entryDelay(): number | undefined {
    return this._entryDelay;
  }

  private set entryDelay(value: number) {
    this.notifyChange(new PropertyChangedInfo('entryDelay', this._entryDelay, value));
    this._entryDelay = value;
  }

  /**
   * Exit delay, in seconds.
   */
  get exitDelay(): number | undefined {
    return this._exitDelay;
  }

  private set exitDelay(value: number) {
    this.notifyChange(new PropertyChangedInfo('exitDelay', this._exitDelay, value));
    this._exitDelay = value;
  }

  /**
   * True if connected to the base unit; otherwise, False.
   */
  get isConnected() {
    return this._isConnected;
  }

  private set isConnected(value: boolean) {
    this.notifyChange(new PropertyChangedInfo('isConnected', this._isConnected, value));
    this._isConnected = value;
  }

  /**
   * Operation mode value.
   */
  get operationMode(): IntEnum<typeof OperationMode> | undefined {
    return this._operationMode;
  }

  private set operationMode(value: IntEnum<typeof OperationMode>) {
    this.notifyChange(new PropertyChangedInfo('operationModeValue', this._operationMode, value));
    this._operationMode = value;
  }

  /**
   * Control password, if one has been assigned on the base unit.
   */
  get password() {
    return this.protocol.password;
  }

  set password(password: string) {
    this.protocol.password = password;
  }

  /**
   * ROM version string.
   */
  get ROMVersion(): string | undefined {
    return this._ROMVersion;
  }

  private set ROMVersion(value: string) {
    this.notifyChange(new PropertyChangedInfo('ROMVersion', this._ROMVersion, value));
    this._ROMVersion = value;
  }

  /**
   * Current state of the base unit.
   */
  get state(): number | undefined {
    return this._state;
  }

  private set state(value: number) {
    this.notifyChange(new PropertyChangedInfo('state', this._state, value));
    this._state = value;
  }

  /**
   * Start monitoring the base unit.
   */
  start() {
    logger.debug('Connecting to %s:%s', this.protocol.host, this.protocol.port);
    return this.protocol.open();
  }

  /**
   * Stop monitoring the base unit.
   */
  stop() {
    return this.protocol.close();
  }

  /**
   * Clear the alarm/warning LEDs on base unit and stop siren.
   *
   * @param password will be used instead of the password property when issuing
   *  the command
   */
  async clearStatus(password?: string) {
    await this.protocol.execute(new ClearStatusCommand(), password);
  }

  /**
   * Enroll a new device on the base unit.
   *
   * @param category category of device the base unit will listen for.
   */
  async addDevice(category: DeviceCategory) {
    await this.protocol.execute(new AddDeviceCommand(category));
  }

  /**
   * Change settings for a device on the base unit.
   *
   * @param deviceId unique identifier for the device to be changed.
   * @param groupNumber group number the device is to be assigned to.
   * @param unitNumber unit number the device is to be assigned to.
   * @param enableStatus  flags indicating settings to enable.
   */
  async changeDevice(deviceId: number, groupNumber: number, unitNumber: number, enableStatus: number) {
    // Lookup device using zone to obtain an accurate index and current
    // values, which will be needed to perform the change command
    const device = this.devices.get(deviceId);

    if (!device) {
      logger.warn(`No device with id '${deviceId}' found in the collection.`);
      return;
    }

    const getDeviceResponse = await this.protocol.execute<DeviceInfoResponse | DeviceNotFoundResponse>(
      new GetDeviceCommand(device.category, device.groupNumber, device.unitNumber),
    );

    if (getDeviceResponse instanceof DeviceNotFoundResponse) {
      throw new Error('Device to be changed was not found');
    }

    const changeResponse = await this.protocol.execute<DeviceSettingsResponse>(
      new ChangeDeviceCommand(device.category, getDeviceResponse.index!, groupNumber, unitNumber, enableStatus),
    );
    device.handleResponse(changeResponse);
  }

  /**
   * Delete an enrolled device.
   *
   * @param deviceId unique identifier for the device to be deleted.
   */
  async deleteDevice(deviceId: number) {
    // Lookup device using zone to obtain an accurate index, which is
    // needed to perform the delete command
    const device = this.devices.get(deviceId);

    if (!device) {
      logger.warn(`No device with id '${deviceId}' found in the collection.`);
      return;
    }

    const getDeviceResponse = await this.protocol.execute<DeviceInfoResponse | DeviceNotFoundResponse>(
      new GetDeviceCommand(device.category, device.groupNumber, device.unitNumber),
    );

    if (getDeviceResponse instanceof DeviceNotFoundResponse) {
      throw new Error('Device to be deleted was not found');
    }

    await this.protocol.execute<DeviceDeletedResponse>(
      new DeleteDeviceCommand(device.category, getDeviceResponse.index!),
    );
    this.devices.delete(device.deviceId);

    if (this.onDeviceDeleted) {
      try {
        this.onDeviceDeleted(device);
      } catch (error) {
        logger.error('Unhandled exception in onDeviceDeleted callback');
      }
    }
  }

  /**
   * Get the date/time on the base unit.
   */
  async getDatetime() {
    const response = await this.protocol.execute<DateTimeResponse>(new GetDateTimeCommand());
    return response.remoteDatetime;
  }

  /**
   * Get an entry from the event log.
   *
   * **Note on index:**
   * The latest event log is not 0, its dynamic and to obtain the latest you
   * first need to get any log entry *(usually index 0)* then look at the
   * `response.lastIndex`. That index is the current latest log entry.
   *
   * To get a list of all events in the log, you need to start with the
   * `lastIndex` and then iterate down from that to 0, then from 511 to
   * `lastIndex + 1`
   *
   * @example
   * IE. lastIndex is 197. The loop should go from
   *
   * 197 -> ... -> 0 -> 511  -> ... -> 198
   *
   * @param index Index for the event log entry to be obtained.
   */
  async getEventLog(index: number) {
    const response = await this.protocol.execute<EventLogResponse | EventLogNotFoundResponse>(
      new GetEventLogCommand(index),
    );
    if (response instanceof EventLogResponse) {
      return response;
    }

    return;
  }

  /**
   * Set the date/time on the base unit.
   *
   * @param value if specified, the date/time to be set on the base unit.
   *  if not specified or none, the current date/time is used.
   */
  async setDatetime(value?: DateTime) {
    await this.protocol.execute(new SetDateTimeCommand(value));
  }

  /**
   * Set the operation mode on the base unit.
   *
   * @param operationMode the operation mode to change to
   * @param password will be used instead of the password property when issuing
   *  the command
   */
  async setOperationMode(operationMode: OperationMode, password?: string) {
    await this.protocol.execute(new SetOpModeCommand(operationMode), password);
  }

  private async handleConnectionMade() {
    logger.debug('Connected to LifeSOS alarm');
    this.isConnected = true;

    // Get initial state info and find devices
    await this.getInitialState();
  }

  private handleConnectionClose(hadError: boolean) {
    if (hadError) {
      logger.error('Connection closed to LifeSOS alarm with errors.');
    } else {
      logger.info('Connection closed to LifeSOS alarm');
    }

    this.isConnected = false;
  }

  private handleConnectionError() {
    logger.info('Will try to reconnect to LifeSOS...');
    setTimeout(() => this.start().catch((error) => logger.error(error)), 10 * 1000);
  }

  private async getInitialState() {
    logger.info('Discovering devices and getting initial state...');

    // ROM version may be useful for determining features and commands
    // supported by base unit. May also help with diagnosing issues
    await this.executeRetry(new GetROMVersionCommand(), 'Failed to get ROM version');

    // Get the initial operation mode, exit and entry delay
    await this.executeRetry(new GetOpModeCommand(), 'Failed to get initial operation mode');
    await this.executeRetry(new GetExitDelayCommand(), 'Failed to get exit delay');
    await this.executeRetry(new GetEntryDelayCommand(), 'Failed to get entry delay');

    // Iterate through all enrolled devices
    for (const category of DC_ALL) {
      if (!category.maxDevices) {
        continue;
      }

      for (let index = 0; index < category.maxDevices; index++) {
        logger.debug(`Getting ${category.description} device #${index}`);
        const response = await this.executeRetry(
          new GetDeviceByIndexCommand(category, index),
          `Failed to get ${category.description} device #${index}`,
        );

        if (!response || response instanceof DeviceNotFoundResponse) {
          break;
        }
      }
    }

    logger.info('Device discovery completed and got initial state');
  }

  private handleContactId(contactId: ContactId) {
    // Skip if event code was unrecognised
    if (!contactId.eventCode.value) {
      return;
    }

    // Change of operation mode
    // Note: My LS-30 uses 'Away_QuickArm'/'Disarm' events for Away & Disarm
    // but another user provided a log where their unit uses an 'Away' event
    // with the qualifier indicating if disarmed or armed (refer to
    // https://github.com/rorr73/LifeSOSpy_MQTT/issues/1 for details)
    if (
      contactId.eventCode.value === ContactIDEventCode.Away_QuickArm ||
      (contactId.eventCode.value === ContactIDEventCode.Away &&
        contactId.eventQualifier.value === ContactIDEventQualifier.Restore)
    ) {
      this.operationMode = new IntEnum(OperationMode, OperationMode.Away);
      this.state = BaseUnitState.Away;
    } else if (contactId.eventCode.value === ContactIDEventCode.Home) {
      this.operationMode = new IntEnum(OperationMode, OperationMode.Home);
      this.state = BaseUnitState.Home;
    } else if (
      contactId.eventCode.value === ContactIDEventCode.Disarm ||
      (contactId.eventCode.value === ContactIDEventCode.Away &&
        contactId.eventQualifier.value === ContactIDEventQualifier.Event)
    ) {
      this.operationMode = new IntEnum(OperationMode, OperationMode.Disarm);
      this.state = BaseUnitState.Disarm;
    } else if (contactId.eventCode.value === ContactIDEventCode.MonitorMode) {
      this.operationMode = new IntEnum(OperationMode, OperationMode.Monitor);
      this.state = BaseUnitState.Monitor;
    } else if (
      contactId.eventCode.value === ContactIDEventCategory.Alarm &&
      contactId.eventQualifier.value == ContactIDEventQualifier.Event
    ) {
      // Alarm has been triggered

      // When entry delay expired, return state to Away mode
      if (this.state === BaseUnitState.AwayEntryDelay) {
        this.state = BaseUnitState.Away;
      }
    }

    // Notify via callback if needed
    if (this.onEvent) {
      try {
        this.onEvent(contactId);
      } catch (error) {
        logger.error('Unhandled exception in onEvent callback');
      }
    }
  }

  private handleDeviceEvent(deviceEvent: DeviceEvent) {
    // Get device; there is a chance it may not exist when:
    // - Client has just connected but has not yet enumerated devices, in
    //   which case we can just ignore since we'll be getting the info later
    // - Device was enrolled after we enumerated devices. The base unit doesn't
    //   provide any event when this happens (on my firmware at least), so we
    //   can't do much about it
    const device = this.devices.get(deviceEvent.deviceId);

    if (!device) {
      logger.warn(sprintf('Event for device not in our collection: Id: %06x', deviceEvent.deviceId));
      return;
    }

    // Provide device with event
    device.handleDeviceEvent(deviceEvent);

    // When a remote controller signals operation mode change it normally
    // takes effect immediately, unless switching to Away mode and there is
    // an exit delay set, in which case we'll need to indicate we're
    // delaying the change to Away mode

    // Away mode change is deferred if exit delay set
    if (deviceEvent.eventCode.value === DeviceEventCode.Away && this.operationMode?.value !== OperationMode.Away) {
      const hasByPass = Boolean(device.enableStatus.value & ESFlags.Bypass);
      const hasDelay = Boolean(device.enableStatus.value & ESFlags.Delay);

      if (device.category === DC_CONTROLLER && !hasByPass && hasDelay && (this.exitDelay ?? 0) > 0) {
        this.state = BaseUnitState.AwayExitDelay;
      } else {
        this.operationMode = new IntEnum(OperationMode, OperationMode.Away);
        this.state = BaseUnitState.Away;
      }
    } else if (deviceEvent.eventCode.value === DeviceEventCode.Home) {
      this.operationMode = new IntEnum(OperationMode, OperationMode.Home);
      this.state = BaseUnitState.Home;
    } else if (deviceEvent.eventCode.value === DeviceEventCode.Disarm) {
      this.operationMode = new IntEnum(OperationMode, OperationMode.Disarm);
      this.state = BaseUnitState.Disarm;
    }

    // When a burglar sensor is tripped while in Away mode and an entry
    // delay has been set, we'll need to indicate we're delaying the alarm
    const triggersList: number[] = [DeviceEventCode.Trigger, DeviceEventCode.Open];
    const isTriggerEvent = triggersList.includes(deviceEvent.eventCode.value);
    const isAwayMode = this.operationMode?.value === OperationMode.Away;

    if (isTriggerEvent && isAwayMode) {
      const isBurglarCategory = device.category === DC_BURGLAR;
      const hasBypass = device.enableStatus.has(ESFlags.Bypass);
      const hasInactivity = device.enableStatus.has(ESFlags.Inactivity);
      const hasDelay = device.enableStatus.has(ESFlags.Delay);
      const hasEntryDelay = Boolean(this.entryDelay && this.entryDelay > 0);

      if (isBurglarCategory && !hasBypass && !hasInactivity && hasDelay && hasEntryDelay) {
        this.state = BaseUnitState.AwayEntryDelay;
      }
    }
  }

  private handleResponse(response: Response) {
    // Update any properties of the base unit
    if (response instanceof ROMVersionResponse) {
      this.ROMVersion = response.version;
    } else if (response instanceof OpModeResponse) {
      this.operationMode = response.operationMode;
      this.state = response.operationMode.value;
    } else if (response instanceof ExitDelayResponse) {
      this.exitDelay = response.exitDelay;
    } else if (response instanceof EntryDelayResponse) {
      this.entryDelay = response.entryDelay;
    } else if (response instanceof DateTimeResponse) {
      logger.info(sprintf('Remote date/time %s %s', response.wasSet ? 'was set to' : 'is', response.remoteDatetime));
    } else if (response instanceof DeviceInfoResponse) {
      // Add / Update a device
      const device = this.devices.get(response.deviceId);

      if (device) {
        device.handleResponse(response);
      } else {
        const newDevice = new Device(response);
        this.devices.set(newDevice.deviceId, newDevice);

        if (this.onDeviceAdded) {
          try {
            this.onDeviceAdded(newDevice);
          } catch (error) {
            logger.error('Unhandled exception in onDeviceAdded callback');
          }
        }
      }
    } else if (response instanceof DeviceAddedResponse) {
      // New device enrolled; the info is insufficient, so we'll need
      // to issue a command to get the full device info
      this.executeRetry(
        new GetDeviceByIndexCommand(response.deviceCategory, response.index),
        `Failed to get new ${response.deviceCategory.description} device #${response.index}`,
      );
    }
  }

  private async executeRetry(command: Command, errorMessage: string, maxRetries: number = BaseUnit.RETRY_MAX) {
    // Execute a command and return response if successful; but retry if an
    // error occurs, up to the specified number of attempts. This can be
    // useful given the LS-30 comes with a dodgy unshielded serial cable.

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // @TODO: Handle shutdown?
      // if (this.shutdown || !this.isConnected) {
      if (!this.isConnected) {
        return;
      }

      const response = await this.protocol.execute(command).catch(() => {
        logger.error(`${errorMessage} [Attempt ${attempt}/${maxRetries}]`);
      });

      if (response) {
        return response;
      }
    }
  }

  private notifyChange(changedProp: PropertyChangedInfo) {
    // Skip if unchanged
    if (changedProp.oldValue === changedProp.newValue) {
      return;
    }

    logger.debug(changedProp);

    // Notify via callback if needed
    if (this.onPropertiesChanged) {
      try {
        this.onPropertiesChanged(changedProp);
      } catch (error) {
        logger.error('Unhandled exception in onPropertiesChanged callback');
      }
    }
  }
}
