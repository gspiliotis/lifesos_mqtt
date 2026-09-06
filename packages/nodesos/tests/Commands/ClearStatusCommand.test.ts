import { ACTION_NONE, CMD_CLEAR_STATUS } from '../../src/Const';
import ClearStatusCommand from '../../src/Commands/ClearStatusCommand';

describe('ClearStatusCommand', () => {
  let command: ClearStatusCommand;
  beforeEach(() => {
    command = new ClearStatusCommand();
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_NONE);
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_CLEAR_STATUS);
  });
});
