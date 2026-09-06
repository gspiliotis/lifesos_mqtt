import { DCFlags, DeviceEventCode, DeviceType, FlagEnum, IntEnum } from './Enums';

/**
 * Represents a device event.
 */
class DeviceEvent {
  /**
   * Multipurpose field containing RSSI reading and magnet sensor flag.
   * Recommend using the 'rssi_db', 'rssi_bars' or 'is_closed' properties
   * instead.
   */
  readonly currentStatus: number;

  /**
   * Flags indicating the device characteristics.
   */
  readonly deviceCharacteristics: FlagEnum<typeof DCFlags>;

  /**
   * Unique identifier for the device.
   */
  readonly deviceId: number;

  /**
   * Type of device.
   */
  readonly deviceType: IntEnum<typeof DeviceType>;

  /**
   * Type of event.
   */
  readonly eventCode: IntEnum<typeof DeviceEventCode>;

  /**
   * Message Attribute.
   */
  readonly messageAttribute: number;

  constructor(text: string) {
    if (text.length < 19) {
      throw new Error('Event length is invalid.');
    }

    this.eventCode = new IntEnum(DeviceEventCode, parseInt(text.slice(7, 11), 16));
    this.deviceType = new IntEnum(DeviceType, parseInt(text.slice(11, 13), 16));
    this.deviceId = parseInt(text.slice(13, 19), 16);
    this.messageAttribute = parseInt(text.slice(19, 21), 16);
    this.deviceCharacteristics = new FlagEnum(DCFlags, parseInt(text.substring(21, 23)));
    this.currentStatus = parseInt(text.slice(23, 25), 16);
  }

  /**
   * Received Signal Strength Indication, from 0 to 4 bars.
   */
  get RSSIBars(): number {
    const RSSIDb = this.RSSIDb;
    if (RSSIDb < 45) {
      return 0;
    } else if (RSSIDb < 60) {
      return 1;
    } else if (RSSIDb < 75) {
      return 2;
    } else if (RSSIDb < 90) {
      return 3;
    }
    return 4;
  }

  /**
   * Received Signal Strength Indication, in dB.
   */
  get RSSIDb(): number {
    return Math.max(Math.min(this.currentStatus - 0x40, 99), 0);
  }
}

export default DeviceEvent;
