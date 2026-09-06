import { ACTION_ADD, CMD_DEVICE_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import AddDeviceCommand from '../../src/Commands/AddDeviceCommand';

describe('AddDeviceCommand', () => {
  let command: AddDeviceCommand;
  beforeEach(() => {
    command = new AddDeviceCommand(DC_BURGLAR);
  });

  test('constructor', () => {
    expect(command.deviceCategory).toEqual(DC_BURGLAR);
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_ADD);
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_DEVICE_PREFIX + command.deviceCategory.code);
  });
});
