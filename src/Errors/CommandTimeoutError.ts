import Command from '../Command';

class CommandTimeoutError extends Error {
  /**
   * The issued command.
   */
  readonly command: Command;

  constructor(command: Command) {
    super();
    this.name = this.constructor.name;
    this.command = command;
  }
}

export default CommandTimeoutError;
