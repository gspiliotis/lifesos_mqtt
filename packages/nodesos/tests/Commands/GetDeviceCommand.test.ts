import { ACTION_GET, CMD_DEVICE_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import GetDeviceCommand from '../../src/Commands/GetDeviceCommand';

describe('GetDeviceCommand', () => {
  let command: GetDeviceCommand;
  beforeEach(() => {
    command = new GetDeviceCommand(DC_BURGLAR, 1, 2);
  });

  test('constructor', () => {
    expect(command.deviceCategory).toEqual(DC_BURGLAR);
    expect(command.groupNumber).toBe(1);
    expect(command.unitNumber).toBe(2);
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_GET);
  });

  test('args', () => {
    expect(command.args).toBe('0102');
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_DEVICE_PREFIX + command.deviceCategory.code);
  });
});
