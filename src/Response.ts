/**
 * Represents response from a command issued to the LifeSOS base unit.
 */
abstract class Response {
  /**
   * True if an error occurred; otherwise, False.
   */
  isError: boolean = false;

  /**
   * Provides the command name.
   */
  abstract readonly commandName: string;
}

export default Response;
