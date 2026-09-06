import { ACTION_GET, CMD_ENTRY_DELAY } from '../../src/Const';
import GetEntryDelayCommand from '../../src/Commands/GetEntryDelayCommand';

describe('GetEntryDelayCommand', () => {
  let command: GetEntryDelayCommand;
  beforeEach(() => {
    command = new GetEntryDelayCommand();
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_GET);
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_ENTRY_DELAY);
  });
});
