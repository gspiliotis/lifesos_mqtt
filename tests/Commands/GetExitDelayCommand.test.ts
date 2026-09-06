import { ACTION_GET, CMD_EXIT_DELAY } from '../../src/Const';
import GetExitDelayCommand from '../../src/Commands/GetExitDelayCommand';

describe('GetExitDelayCommand', () => {
  let command: GetExitDelayCommand;
  beforeEach(() => {
    command = new GetExitDelayCommand();
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_GET);
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_EXIT_DELAY);
  });
});
