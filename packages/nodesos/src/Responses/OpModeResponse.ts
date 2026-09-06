import { ACTION_SET, CMD_OPMODE } from '../Const';
import { IntEnum, OperationMode } from '../Enums';
import Response from '../Response';
import { fromAsciiHex } from '../Utils';

/**
 * Response that provides the current operation mode on the LifeSOS base unit.
 */
class OpModeResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName = CMD_OPMODE;
  /**
   * Operation mode on the LifeSOS base unit.
   */
  readonly operationMode: IntEnum<typeof OperationMode>;

  /**
   * True if operation mode was set on the base unit; otherwise, False.
   */
  readonly wasSet: boolean;

  constructor(text: string) {
    super();

    text = text.slice(CMD_OPMODE.length);
    this.wasSet = text.startsWith(ACTION_SET);
    if (this.wasSet) {
      text = text.slice(1);
    }

    this.operationMode = new IntEnum(OperationMode, fromAsciiHex(text));
  }
}

export default OpModeResponse;
