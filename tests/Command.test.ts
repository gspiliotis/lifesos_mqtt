import Command from '../src/Command';
import { ACTION_NONE } from '../src/Const';

class TestCommand extends Command {
  get name(): string {
    return 'CMD-NAME';
  }
}

describe('Command', () => {
  let command: TestCommand;
  beforeEach(() => {
    command = new TestCommand();
  });

  test('action', () => {
    expect(command.action).toEqual(ACTION_NONE);
  });

  test('args', () => {
    expect(command.args).toBe('');
  });

  test('format', () => {
    expect(command.format()).toBe('!CMD-NAME&');
  });

  test('format with password', () => {
    expect(command.format('foobar')).toBe('!CMD-NAMEfoobar&');
  });
});
