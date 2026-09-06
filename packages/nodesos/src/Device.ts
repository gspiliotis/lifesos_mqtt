import * as log4js from 'log4js';
import DeviceCategory from './DeviceCategory';
import DeviceEvent from './DeviceEvent';
import { DCFlags, DeviceEventCode, DeviceType, ESFlags, FlagEnum, IntEnum } from './Enums';
import PropertyChangedInfo from './PropertyChangedInfo';
import Response from './Response';
import DeviceInfoResponse from './Responses/DeviceInfoResponse';
import DeviceSettingsResponse from './Responses/DeviceSettingsResponse';

const logger = log4js.getLogger('NodeSOS.Device');

/**
 * Represents a device that has been enrolled on the base unit.
 */
class Device {
  private readonly _category: DeviceCategory;
  private readonly _characteristics: FlagEnum<typeof DCFlags>;
  private readonly _deviceId: number;
  private _enableStatus: FlagEnum<typeof ESFlags>;
  private _groupNumber: number;
  private _isClosed?: boolean;
  private readonly _messageAttribute: number;
  private _rssiBars: number;
  private _rssiDb: number;
  private readonly _type?: IntEnum<typeof DeviceType>;
  private _unitNumber: number;
  private _zone: string;

  /**
   * Called when an event occurs.
   */
  onEvent?: (device: Device, eventCode: DeviceEventCode) => void;
  /**
   * Called after property values have been changed.
   */
  onPropertiesChanged?: (device: Device, changedProp: PropertyChangedInfo) => void;

  constructor(response: DeviceInfoResponse) {
    this.handleResponse = this.handleResponse.bind(this);

    // Don't use the setters as that will trigger notifications callbacks.
    this._deviceId = response.deviceId;
    this._category = response.deviceCategory;
    this._messageAttribute = response.messageAttribute;
    this._type = response.deviceType;
    this._characteristics = response.deviceCharacteristics;

    this._enableStatus = response.enableStatus;
    this._groupNumber = response.groupNumber;
    this._isClosed = response.isClosed;
    this._rssiBars = response.RSSIBars;
    this._rssiDb = response.RSSIDb;
    this._unitNumber = response.unitNumber;
    this._zone = response.zone;
  }

  /**
   * Category for the device.
   */
  get category() {
    return this._category;
  }

  /**
   * Flags indicating the device characteristics.
   */
  get characteristics() {
    return this._characteristics;
  }

  /**
   * Unique identifier for the device.
   */
  get deviceId() {
    return this._deviceId;
  }

  /**
   * Flags indicating settings that have been enabled.
   */
  get enableStatus() {
    return this._enableStatus;
  }

  set enableStatus(value: FlagEnum<typeof ESFlags>) {
    this.notifyChange(new PropertyChangedInfo('enableStatus', this._enableStatus, value));
    this._enableStatus = value;
  }

  /**
   * Group number the device is assigned to.
   */
  get groupNumber() {
    return this._groupNumber;
  }

  private set groupNumber(value: number) {
    this.notifyChange(new PropertyChangedInfo('groupNumber', this._groupNumber, value));
    this._groupNumber = value;
  }

  /**
   * Status of a Magnet Sensor (True if Closed, False if Open).
   */
  get isClosed() {
    return this._isClosed;
  }

  private set isClosed(value: boolean | undefined) {
    this.notifyChange(new PropertyChangedInfo('isClosed', this._isClosed, value));
    this._isClosed = value;
  }

  /**
   * Message attribute; used to encode/decode Special device values.
   */
  get messageAttribute(): number {
    return this._messageAttribute;
  }

  /**
   * Received Signal Strength Indication, from 0 to 4 bars.
   */
  get rssiBars() {
    return this._rssiBars;
  }

  set rssiBars(value: number) {
    this.notifyChange(new PropertyChangedInfo('rssiBars', this._rssiBars, value));
    this._rssiBars = value;
  }

  /**
   * Received Signal Strength Indication, in dB.
   */
  get rssiDb() {
    return this._rssiDb;
  }

  set rssiDb(value: number) {
    this.notifyChange(new PropertyChangedInfo('rssiDb', this._rssiDb, value));
    this._rssiDb = value;
  }

  /**
   * Type of device.
   */
  get type() {
    return this._type;
  }

  /**
   * Unit number the device is assigned to (within the group).
   */
  get unitNumber() {
    return this._unitNumber;
  }

  set unitNumber(value: number) {
    this.notifyChange(new PropertyChangedInfo('unitNumber', this._unitNumber, value));
    this._unitNumber = value;
  }

  /**
   * Zone the device is assigned to.
   */
  get zone() {
    return this._zone;
  }

  set zone(value: string) {
    this.notifyChange(new PropertyChangedInfo('zone', this._zone, value));
    this._zone = value;
  }

  handleDeviceEvent(deviceEvent: DeviceEvent) {
    // Magnet sensor open/close state only exists in device info response;
    // for device events, we should update based on the event Open/Close
    if (deviceEvent.eventCode.value === DeviceEventCode.Open) {
      this.isClosed = false;
    } else if (deviceEvent.eventCode.value === DeviceEventCode.Close) {
      this.isClosed = true;
    }

    this.rssiBars = deviceEvent.RSSIBars;
    this.rssiDb = deviceEvent.RSSIDb;

    // Notify via callback if needed
    if (this.onEvent && deviceEvent.eventCode.string !== 'undefined') {
      try {
        this.onEvent(this, deviceEvent.eventCode.value as DeviceEventCode);
      } catch (error) {
        logger.error('Unhandled exception in onEvent callback');
      }
    }
  }

  handleResponse(response: Response) {
    // Update properties
    if (response instanceof DeviceInfoResponse) {
      this.enableStatus = response.enableStatus;
      this.groupNumber = response.groupNumber;
      this.isClosed = response.isClosed;
      this.rssiBars = response.RSSIBars;
      this.rssiDb = response.RSSIDb;
      this.unitNumber = response.unitNumber;
      this.zone = response.zone;
    } else if (response instanceof DeviceSettingsResponse) {
      this.enableStatus = response.enableStatus;
      this.groupNumber = response.groupNumber;
      this.unitNumber = response.unitNumber;
      this.zone = response.zone;
    }
  }

  protected notifyChange(changedProp: PropertyChangedInfo) {
    // Skip if unchanged
    if (changedProp.oldValue === changedProp.newValue) {
      return;
    }

    logger.debug(changedProp);

    // Notify via callback if needed
    if (this.onPropertiesChanged) {
      try {
        this.onPropertiesChanged(this, changedProp);
      } catch (error) {
        logger.error('Unhandled exception in onPropertiesChanged callback');
      }
    }
  }
}

export default Device;
