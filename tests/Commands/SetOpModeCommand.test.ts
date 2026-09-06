import { ACTION_SET, CMD_OPMODE } from '../../src/Const';
import { OperationMode } from '../../src/Enums';
import SetOpModeCommand from '../../src/Commands/SetOpModeCommand';

describe('SetOpModeCommand', () => {
  let command: SetOpModeCommand;
  beforeEach(() => {
    command = new SetOpModeCommand(OperationMode.Disarm);
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_SET);
  });

  test('args', () => {
    expect(command.args).toBe('0');
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_OPMODE);
  });
});
