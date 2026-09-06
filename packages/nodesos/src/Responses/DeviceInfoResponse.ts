import { sprintf } from 'sprintf-js';
import { CMD_DEVICE_PREFIX } from '../Const';
import DeviceCategory, { DC_ALL_LOOKUP } from '../DeviceCategory';
import { DCFlags, DeviceType, ESFlags, FlagEnum, IntEnum } from '../Enums';
import Response from '../Response';
import { fromAsciiHex } from '../Utils';

/**
 * Response that provides information for a device, and the settings that
 * have been configured for it on the base unit.
 */
class DeviceInfoResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName: string;

  /**
   * Multipurpose field containing RSSI reading and magnet sensor flag.
   * Recommend using the 'rssi_db', 'rssi_bars' or 'is_closed' properties
   * instead.
   */
  readonly currentStatus: number;

  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

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
   * Supervisory down count timer.
   * When this reaches zero, a 'Loss of Supervision-RF' event is raised.
   */
  readonly downCount: number;

  /**
   * Flags indicating settings that have been enabled.
   */
  readonly enableStatus: FlagEnum<typeof ESFlags>;

  /**
   * Group number the device is assigned to.
   */
  readonly groupNumber: number;

  /**
   * Index of device within the category (also known as memory address).
   *
   * Note it only exists in response to a GetDevice command, and will get
   * out of sync if any devices above it are deleted.
   */
  readonly index?: number;

  /**
   * Message Attribute.
   */
  readonly messageAttribute: number;

  /**
   * Unit number the device is assigned to (within group).
   */
  readonly unitNumber: number;

  constructor(text: string) {
    super();

    this.commandName = text.slice(0, 2);
    this.deviceCategory = DC_ALL_LOOKUP[text.slice(1, 2)];
    text = text.slice(2);

    if (this.commandName.startsWith(CMD_DEVICE_PREFIX)) {
      this.index = fromAsciiHex(text.slice(0, 2));
      text = text.slice(2);
    }

    this.deviceType = new IntEnum(DeviceType, fromAsciiHex(text.slice(0, 2)));
    this.deviceId = fromAsciiHex(text.slice(2, 8));
    this.messageAttribute = fromAsciiHex(text.slice(8, 10));
    this.deviceCharacteristics = new FlagEnum(DCFlags, fromAsciiHex(text.slice(10, 12)));
    // 12-14 unknown
    this.groupNumber = fromAsciiHex(text.slice(14, 16));
    this.unitNumber = fromAsciiHex(text.slice(16, 18));
    this.enableStatus = new FlagEnum(ESFlags, fromAsciiHex(text.slice(18, 22)));
    // 22-26 Switches
    this.currentStatus = fromAsciiHex(text.slice(26, 28));
    this.downCount = fromAsciiHex(text.slice(28, 30));
  }

  /**
   * For Magnet Sensor; True if Closed, False if Open.
   */
  get isClosed(): boolean | undefined {
    if (this.deviceType.value === DeviceType.DoorMagnet) {
      return !!(this.currentStatus & 0x01);
    }
    return;
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

  /**
   * Zone the device is assigned to.
   */
  get zone(): string {
    return sprintf('%02x-%02x', this.groupNumber, this.unitNumber);
  }
}

export default DeviceInfoResponse;
