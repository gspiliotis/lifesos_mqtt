import Command from '../Command';
import { CMD_CLEAR_STATUS } from '../Const';

/**
 * Clear the alarm/warning LEDs on base unit and stop siren.
 */
class ClearStatusCommand extends Command {
  /**
   * @inheritDoc
   */
  get name(): string {
    return CMD_CLEAR_STATUS;
  }
}

export default ClearStatusCommand;
