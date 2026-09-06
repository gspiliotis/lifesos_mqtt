import { DateTime } from 'luxon';
import { ACTION_SET, CMD_DATETIME } from '../Const';
import Response from '../Response';

/**
 * Response that provides the current date/time on the LifeSOS base unit.
 */
class DateTimeResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName = CMD_DATETIME;

  /**
   * Date/Time on the LifeSOS base unit.
   */
  readonly remoteDatetime?: string;

  /**
   * True if date/time was set (SetDateTimeCommand) on the base unit
   * otherwise False (GetDateTimeCommand).
   *
   * @see SetDateTimeCommand
   * @see GetDateTimeCommand
   */
  readonly wasSet: boolean;

  constructor(text: string) {
    super();

    text = text.slice(CMD_DATETIME.length);

    this.wasSet = text.startsWith(ACTION_SET);
    if (this.wasSet) {
      text = text.slice(1);
    }

    if (text.length !== 11) {
      throw new Error(`Date/Time response length is invalid. Got '${text}'`);
    }

    this.remoteDatetime = DateTime.fromFormat(text, 'yyLLddcHHmm').toISO({ includeOffset: false }) ?? undefined;
  }
}

export default DateTimeResponse;
