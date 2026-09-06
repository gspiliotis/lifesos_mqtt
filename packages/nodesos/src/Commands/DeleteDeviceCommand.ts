import Command from '../Command';
import { ACTION_DEL, CMD_DEVICE_PREFIX } from '../Const';
import DeviceCategory from '../DeviceCategory';
import { toAsciiHex } from '../Utils';

/**
 * Delete an enrolled device.
 */
class DeleteDeviceCommand extends Command {
  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

  /**
   * Index of device within the category (also known as memory address).
   */
  readonly index: number;

  constructor(deviceCategory: DeviceCategory, index: number) {
    super();

    this.deviceCategory = deviceCategory;
    this.index = index;
  }

  /**
   * @inheritDoc
   */
  get action(): string {
    return ACTION_DEL;
  }
  /**
   * @inheritDoc
   */
  get args(): string {
    return toAsciiHex(this.index, 2);
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_DEVICE_PREFIX + this.deviceCategory.code;
  }
}

export default DeleteDeviceCommand;
