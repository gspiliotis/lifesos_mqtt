import { ACTION_GET, CMD_DEVBYIDX_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import GetDeviceByIndexCommand from '../../src/Commands/GetDeviceByIndexCommand';

describe('GetDeviceByIndexCommand', () => {
  let command: GetDeviceByIndexCommand;
  beforeEach(() => {
    command = new GetDeviceByIndexCommand(DC_BURGLAR, 15);
  });

  test('constructor', () => {
    expect(command.deviceCategory).toEqual(DC_BURGLAR);
    expect(command.index).toBe(15);
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_GET);
  });

  test('args', () => {
    expect(command.args).toBe('0?');
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_DEVBYIDX_PREFIX + command.deviceCategory.code);
  });
});
