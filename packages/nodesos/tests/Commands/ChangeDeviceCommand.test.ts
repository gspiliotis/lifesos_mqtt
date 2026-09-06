import { ACTION_SET, CMD_DEVICE_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import { ESFlags } from '../../src/Enums';
import ChangeDeviceCommand from '../../src/Commands/ChangeDeviceCommand';

describe('ChangeDeviceCommand', () => {
  let command: ChangeDeviceCommand;
  beforeEach(() => {
    command = new ChangeDeviceCommand(DC_BURGLAR, 1, 2, 3, ESFlags.Supervised ^ ESFlags.AlarmSiren);
  });

  test('constructor', () => {
    expect(command.deviceCategory).toEqual(DC_BURGLAR);
    expect(command.index).toBe(1);
    expect(command.groupNumber).toBe(2);
    expect(command.unitNumber).toBe(3);
    expect(command.enableStatus).toEqual(ESFlags.Supervised ^ ESFlags.AlarmSiren);
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_SET);
  });

  test('args', () => {
    const enableStatus = (ESFlags.Supervised ^ ESFlags.AlarmSiren).toString(16).padStart(4, '0');
    expect(command.args).toBe(`010203${enableStatus}0000`);
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_DEVICE_PREFIX + command.deviceCategory.code);
  });
});
