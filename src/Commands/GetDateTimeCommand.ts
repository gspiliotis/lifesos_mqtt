import Command from '../Command';
import { ACTION_GET, CMD_DATETIME } from '../Const';

/**
 * Command to get the date/time from the LifeSOS base unit.
 */
class GetDateTimeCommand extends Command {
  /**
   * @inheritDoc
   */
  get action(): string {
    return ACTION_GET;
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_DATETIME;
  }
}

export default GetDateTimeCommand;
