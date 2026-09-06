import { CMD_DEVICE_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import DeviceAddingResponse from '../../src/Responses/DeviceAddingResponse';

describe('DeviceAddingResponse', () => {
  test('constructor', () => {
    const response = new DeviceAddingResponse('ibl');
    expect(response.commandName).toEqual(CMD_DEVICE_PREFIX + DC_BURGLAR.code);
    expect(response.deviceCategory).toEqual(DC_BURGLAR);
  });
});
