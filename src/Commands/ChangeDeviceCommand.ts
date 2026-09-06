import { sprintf } from 'sprintf-js';
import Command from '../Command';
import { ACTION_SET, CMD_DEVICE_PREFIX } from '../Const';
import DeviceCategory from '../DeviceCategory';
import { toAsciiHex } from '../Utils';

/**
 * Change settings for a device on the base unit.
 */
class ChangeDeviceCommand extends Command {
  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

  /**
   * Flags indicating settings that have been enabled.
   */
  readonly enableStatus: number;

  /**
   * Group number the device is assigned to.
   */
  readonly groupNumber: number;

  /**
   * Index of device within the category (also known as memory address)
   */
  readonly index: number;

  /**
   * Unit number the device is assigned to (within group).
   */
  readonly unitNumber: number;

  constructor(
    deviceCategory: DeviceCategory,
    index: number,
    groupNumber: number,
    unitNumber: number,
    enableStatus: number,
  ) {
    super();

    this.deviceCategory = deviceCategory;
    this.index = index;
    this.groupNumber = groupNumber;
    this.unitNumber = unitNumber;
    this.enableStatus = enableStatus;
  }

  /**
   * @inheritDoc
   */
  get action(): string {
    return ACTION_SET;
  }

  /**
   * @inheritDoc
   */
  get args(): string {
    return sprintf(
      '%s%s%s%s%s',
      toAsciiHex(this.index, 2),
      toAsciiHex(this.groupNumber, 2),
      toAsciiHex(this.unitNumber, 2),
      toAsciiHex(this.enableStatus, 4),
      toAsciiHex(0, 4),
    );
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_DEVICE_PREFIX + this.deviceCategory.code;
  }
}

export default ChangeDeviceCommand;
