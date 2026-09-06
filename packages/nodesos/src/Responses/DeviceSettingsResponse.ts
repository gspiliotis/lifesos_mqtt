import { sprintf } from 'sprintf-js';
import DeviceCategory, { DC_ALL_LOOKUP } from '../DeviceCategory';
import { ESFlags, FlagEnum } from '../Enums';
import Response from '../Response';
import { fromAsciiHex } from '../Utils';

/**
 * Settings configured in base unit for a device.
 */
abstract class DeviceSettingsResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName: string;

  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

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
  readonly index: number;

  /**
   * Unit number the device is assigned to (within group).
   */
  readonly unitNumber: number;

  protected constructor(text: string) {
    super();

    this.commandName = text.slice(0, 2);
    this.deviceCategory = DC_ALL_LOOKUP[text.slice(1, 2)];
    text = text.slice(3);
    this.index = fromAsciiHex(text.slice(0, 2));
    this.groupNumber = fromAsciiHex(text.slice(2, 4));
    this.unitNumber = fromAsciiHex(text.slice(4, 6));
    this.enableStatus = new FlagEnum(ESFlags, fromAsciiHex(text.slice(6, 10)));
  }

  /**
   * Zone the device is assigned to.
   */
  get zone(): string {
    return sprintf('%02x-%02x', this.groupNumber, this.unitNumber);
  }
}

export default DeviceSettingsResponse;
