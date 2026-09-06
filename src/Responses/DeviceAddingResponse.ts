import DeviceCategory, { DC_ALL_LOOKUP } from '../DeviceCategory';
import Response from '../Response';

class DeviceAddingResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName: string;

  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

  constructor(text: string) {
    super();
    this.commandName = text.slice(0, 2);
    this.deviceCategory = DC_ALL_LOOKUP[text.slice(1, 2)];
  }
}

export default DeviceAddingResponse;
