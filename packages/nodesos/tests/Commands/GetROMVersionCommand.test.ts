import { ACTION_GET, CMD_ROMVER } from '../../src/Const';
import GetROMVersionCommand from '../../src/Commands/GetROMVersionCommand';

describe('GetROMVersionCommand', () => {
  let command: GetROMVersionCommand;
  beforeEach(() => {
    command = new GetROMVersionCommand();
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_GET);
  });

  test('name', () => {
    expect(command.name).toEqual(CMD_ROMVER);
  });
});
