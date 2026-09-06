import Command from '../Command';
import { ACTION_GET, CMD_OPMODE } from '../Const';

/**
 * Command to get the current operation mode from the LifeSOS base unit.
 */
class GetOpModeCommand extends Command {
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
    return CMD_OPMODE;
  }
}

export default GetOpModeCommand;
