import Command from '../Command';
import { ACTION_GET, CMD_ROMVER } from '../Const';

/**
 * Command to get the ROM version string from the LifeSOS base unit.
 */
class GetROMVersionCommand extends Command {
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
    return CMD_ROMVER;
  }
}

export default GetROMVersionCommand;
