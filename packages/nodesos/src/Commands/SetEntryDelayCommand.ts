import Command from '../Command';
import { ACTION_SET, CMD_ENTRY_DELAY } from '../Const';
import { toAsciiHex } from '../Utils';

/**
 * Command to set the entry delay on the LifeSOS base unit.
 */
class SetEntryDelayCommand extends Command {
  /**
   * Entry delay (in seconds) on the LifeSOS base unit.
   */
  readonly entryDelay: number;

  constructor(entryDelay: number) {
    super();

    if (entryDelay < 0x00) {
      throw new Error('Entry delay cannot be negative.');
    } else if (entryDelay > 0xff) {
      throw new Error('Entry delay cannot exceed 255 seconds.');
    }

    this.entryDelay = entryDelay;
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
    return toAsciiHex(this.entryDelay, 2);
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_ENTRY_DELAY;
  }
}

export default SetEntryDelayCommand;
