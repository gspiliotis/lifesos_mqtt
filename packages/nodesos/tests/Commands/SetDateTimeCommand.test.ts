import { DateTime, Settings } from 'luxon';
import { ACTION_SET, CMD_DATETIME } from '../../src/Const';
import SetDateTimeCommand from '../../src/Commands/SetDateTimeCommand';

describe('SetDateTimeCommand', () => {
  let command: SetDateTimeCommand;
  let originalNow: () => number;
  const expectedNow = DateTime.local(1986, 4, 20, 12, 30, 0, 0);

  beforeEach(() => {
    originalNow = Settings.now;
    Settings.now = () => expectedNow.toMillis();
    command = new SetDateTimeCommand();
  });

  afterEach(() => {
    Settings.now = originalNow;
  });

  test('constructor with given value', () => {
    command = new SetDateTimeCommand(DateTime.now());
    expect(command.value).toEqual(expectedNow);
  });

  test('constructor without given value', () => {
    command = new SetDateTimeCommand();
    expect(command.action).toEqual(ACTION_SET);
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_SET);
  });

  test('args', () => {
    expect(command.args).toBe('86042071230');
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_DATETIME);
  });
});
