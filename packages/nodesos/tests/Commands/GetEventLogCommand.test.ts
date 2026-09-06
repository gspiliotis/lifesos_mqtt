import { ACTION_NONE, CMD_EVENT_LOG } from '../../src/Const';
import GetEventLogCommand from '../../src/Commands/GetEventLogCommand';

describe('GetEventLogCommand', () => {
  let command: GetEventLogCommand;
  beforeEach(() => {
    command = new GetEventLogCommand(1);
  });

  test('constructor', () => {
    expect(command.index).toBe(1);
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_NONE);
  });

  test('args', () => {
    expect(command.args).toBe('001');
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_EVENT_LOG);
  });

  test('format', () => {
    expect(command.format()).toBe('!ev001&');
  });
});
