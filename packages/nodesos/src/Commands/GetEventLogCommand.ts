import Command from '../Command';
import { CMD_EVENT_LOG } from '../Const';
import { toAsciiHex } from '../Utils';

/**
 * Get an entry from the event log.
 */
class GetEventLogCommand extends Command {
  /**
   * Index for entry in the event log.
   */
  readonly index: number;

  constructor(index: number) {
    super();

    this.index = index;
  }

  /**
   * @inheritDoc
   */
  get args(): string {
    return toAsciiHex(this.index, 3);
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_EVENT_LOG;
  }
}

export default GetEventLogCommand;
