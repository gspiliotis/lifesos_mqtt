import { DateTime } from 'luxon';
import Command from '../Command';
import { ACTION_SET, CMD_DATETIME } from '../Const';

/**
 * Command to set the date/time on the LifeSOS base unit.
 * The week data is used for Home Automation.
 */
class SetDateTimeCommand extends Command {
  /**
   * Date/Time to be set, or None for the current local date/time.
   */
  readonly value: DateTime = DateTime.now();

  constructor(value?: DateTime) {
    super();
    if (value) {
      this.value = value;
    }
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
    return this.value.toFormat('yyLLddcHHmm');
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_DATETIME;
  }
}

export default SetDateTimeCommand;
