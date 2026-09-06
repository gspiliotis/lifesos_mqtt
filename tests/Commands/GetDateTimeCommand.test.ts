import { ACTION_GET, CMD_DATETIME } from '../../src/Const';
import GetDateTimeCommand from '../../src/Commands/GetDateTimeCommand';

describe('GetDateTimeCommand', () => {
  let command: GetDateTimeCommand;
  beforeEach(() => {
    command = new GetDateTimeCommand();
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_GET);
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_DATETIME);
  });
});
