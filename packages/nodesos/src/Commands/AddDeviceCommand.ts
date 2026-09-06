import Command from '../Command';
import { ACTION_ADD, CMD_DEVICE_PREFIX } from '../Const';
import DeviceCategory from '../DeviceCategory';

/**
 * Enroll new device on the LifeSOS base unit.
 */
class AddDeviceCommand extends Command {
  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

  constructor(deviceCategory: DeviceCategory) {
    super();

    this.deviceCategory = deviceCategory;
  }

  /**
   * @inheritDoc
   */
  get action(): string {
    return ACTION_ADD;
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_DEVICE_PREFIX + this.deviceCategory.code;
  }
}

export default AddDeviceCommand;
