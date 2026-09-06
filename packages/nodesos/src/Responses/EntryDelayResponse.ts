import { ACTION_SET, CMD_ENTRY_DELAY } from '../Const';
import Response from '../Response';
import { fromAsciiHex } from '../Utils';

/**
 * Response that provides the current entry delay on the LifeSOS base unit.
 */
class EntryDelayResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName = CMD_ENTRY_DELAY;

  /**
   * Entry delay (in seconds) on the LifeSOS base unit.
   */
  readonly entryDelay: number;

  /**
   * True if entry delay was set (SetEntryDelayCommand) on the base unit
   * otherwise, False (GetEntryDelayCommand).
   *
   * @see SetEntryDelayCommand
   * @see GetEntryDelayCommand
   */
  readonly wasSet: boolean;

  constructor(text: string) {
    super();

    text = text.slice(CMD_ENTRY_DELAY.length);
    this.wasSet = text.startsWith(ACTION_SET);
    if (this.wasSet) {
      text = text.slice(1);
    }

    this.entryDelay = fromAsciiHex(text);
  }
}

export default EntryDelayResponse;
