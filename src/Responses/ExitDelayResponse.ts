import { ACTION_SET, CMD_EXIT_DELAY } from '../Const';
import Response from '../Response';
import { fromAsciiHex } from '../Utils';

/**
 * Response that provides the current exit delay on the LifeSOS base unit.
 */
class ExitDelayResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName = CMD_EXIT_DELAY;

  /**
   * Exit delay (in seconds) on the LifeSOS base unit.
   */
  readonly exitDelay: number;

  /**
   * True if exit delay was set (SetExitDelayCommand) on the base unit
   * otherwise, False (GetExitDelayCommand).
   *
   * @see SetExitDelayCommand
   * @see GetExitDelayCommand
   */
  readonly wasSet: boolean;

  constructor(text: string) {
    super();
    text = text.slice(CMD_EXIT_DELAY.length);
    this.wasSet = text.startsWith(ACTION_SET);
    if (this.wasSet) {
      text = text.slice(1);
    }
    this.exitDelay = fromAsciiHex(text);
  }
}

export default ExitDelayResponse;
