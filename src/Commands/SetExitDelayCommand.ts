import Command from '../Command';
import { ACTION_SET, CMD_EXIT_DELAY } from '../Const';
import { toAsciiHex } from '../Utils';

/**
 * Command to set the exit delay on the LifeSOS base unit.
 */
class SetExitDelayCommand extends Command {
  /**
   * Exit delay (in seconds) on the LifeSOS base unit.
   */
  readonly exitDelay: number;

  constructor(exitDelay: number) {
    super();

    if (exitDelay < 0x00) {
      throw new Error('Exit delay cannot be negative.');
    } else if (exitDelay > 0xff) {
      throw new Error('Exit delay cannot exceed 255 seconds.');
    }

    this.exitDelay = exitDelay;
  }

  /**
   * @inheritDoc
   */
  get action(): string {
    return ACTION_SET;
  }

  /**
   * @inheritDoc
   */
  get args(): string {
    return toAsciiHex(this.exitDelay, 2);
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_EXIT_DELAY;
  }
}

export default SetExitDelayCommand;
