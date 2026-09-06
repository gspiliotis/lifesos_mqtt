import { ACTION_NONE, MARKER_END, MARKER_START } from './Const';

/**
 * Represents a command to be issued to the LifeSOS base unit.
 */
abstract class Command {
  /**
   * Provides the action to perform; e.g. get, set.
   */
  get action(): string {
    return ACTION_NONE;
  }

  /**
   * Provides arguments for the command.
   */
  get args(): string {
    return '';
  }

  /**
   * Provides the command name.
   */
  abstract get name(): string;

  format(password: string = '') {
    return MARKER_START + this.name + this.action + this.args + password + MARKER_END;
  }
}

export default Command;
