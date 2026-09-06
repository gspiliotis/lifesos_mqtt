import Command from '../Command';
import { ACTION_GET, CMD_DEVICE_PREFIX } from '../Const';
import DeviceCategory from '../DeviceCategory';
import { toAsciiHex } from '../Utils';

/**
 * Get a device using the specified category and zone.
 */
class GetDeviceCommand extends Command {
  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

  /**
   * Group number the device is assigned to.
   */
  readonly groupNumber: number;

  /**
   * Unit number the device is assigned to (within group).
   */
  readonly unitNumber: number;

  constructor(deviceCategory: DeviceCategory, groupNumber: number, unitNumber: number) {
    super();
    this.deviceCategory = deviceCategory;
    this.groupNumber = groupNumber;
    this.unitNumber = unitNumber;
  }

  /**
   * @inheritDoc
   */
  get action(): string {
    return ACTION_GET;
  }

  /**
   * @inheritDoc
   */
  get args(): string {
    return `${toAsciiHex(this.groupNumber, 2)}${toAsciiHex(this.unitNumber, 2)}`;
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_DEVICE_PREFIX + this.deviceCategory.code;
  }
}

export default GetDeviceCommand;
