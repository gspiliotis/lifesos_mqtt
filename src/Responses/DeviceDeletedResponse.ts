import DeviceCategory, { DC_ALL_LOOKUP } from '../DeviceCategory';
import Response from '../Response';
import { fromAsciiHex } from '../Utils';

/**
 * Response that indicates a device was deleted.
 */
class DeviceDeletedResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName: string;

  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

  /**
   * Index of device within the category.
   */
  readonly index: number;

  constructor(text: string) {
    super();

    this.commandName = text.slice(0, 2);
    this.deviceCategory = DC_ALL_LOOKUP[text.slice(1, 2)];
    text = text.slice(3);
    this.index = fromAsciiHex(text.slice(0, 2));
  }
}

export default DeviceDeletedResponse;
