import Command from '../Command';
import { ACTION_GET, CMD_ENTRY_DELAY } from '../Const';

/**
 * Command to get the entry delay from the LifeSOS base unit.
 */
class GetEntryDelayCommand extends Command {
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
    return CMD_ENTRY_DELAY;
  }
}

export default GetEntryDelayCommand;
