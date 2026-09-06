import Command from '../Command';
import { ACTION_SET, CMD_OPMODE } from '../Const';
import { OperationMode } from '../Enums';

/**
 * Command to set the operation mode on the LifeSOS base unit.
 */
class SetOpModeCommand extends Command {
  /**
   * Operation mode to be set.
   */
  readonly operationMode: OperationMode;

  constructor(operationMode: OperationMode) {
    super();
    this.operationMode = operationMode;
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
    return String(this.operationMode);
  }

  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_OPMODE;
  }
}

export default SetOpModeCommand;
