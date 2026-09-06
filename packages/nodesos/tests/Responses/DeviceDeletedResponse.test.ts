import { CMD_DEVICE_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import DeviceDeletedResponse from '../../src/Responses/DeviceDeletedResponse';

describe('DeviceDeletedResponse', () => {
  test('constructor', () => {
    const response = new DeviceDeletedResponse('ibk01');
    expect(response.commandName).toEqual(CMD_DEVICE_PREFIX + DC_BURGLAR.code);
    expect(response.deviceCategory).toEqual(DC_BURGLAR);
    expect(response.index).toBe(1);
  });
});
