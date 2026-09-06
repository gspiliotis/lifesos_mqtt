import Command from '../Command';
import { ACTION_GET, CMD_EXIT_DELAY } from '../Const';

/**
 * Command to get the exit delay from the LifeSOS base unit.
 */
class GetExitDelayCommand extends Command {
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
    return CMD_EXIT_DELAY;
  }
}

export default GetExitDelayCommand;
