import { ACTION_SET, CMD_ENTRY_DELAY } from '../../src/Const';
import SetEntryDelayCommand from '../../src/Commands/SetEntryDelayCommand';

describe('SetEntryDelayCommand', () => {
  let command: SetEntryDelayCommand;
  beforeEach(() => {
    command = new SetEntryDelayCommand(5);
  });

  test('constructor', () => {
    expect(command.entryDelay).toBe(5);
  });

  test('constructor fails when entryDelay < 0x00', () => {
    expect(() => new SetEntryDelayCommand(-1)).toThrow('Entry delay cannot be negative.');
  });

  test('constructor fails when entryDelay < 0xff', () => {
    expect(() => new SetEntryDelayCommand(256)).toThrow('Entry delay cannot exceed 255 seconds.');
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_SET);
  });

  test('args', () => {
    expect(command.args).toBe('05');
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_ENTRY_DELAY);
  });
});
