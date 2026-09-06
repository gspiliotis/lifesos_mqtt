import { CMD_DEVICE_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import DeviceNotFoundResponse from '../../src/Responses/DeviceNotFoundResponse';

describe('DeviceNotFoundResponse', () => {
  test('constructor', () => {
    const response = new DeviceNotFoundResponse('ibno');
    expect(response.deviceCategory).toEqual(DC_BURGLAR);
    expect(response.commandName).toEqual(CMD_DEVICE_PREFIX + DC_BURGLAR.code);
  });
});
