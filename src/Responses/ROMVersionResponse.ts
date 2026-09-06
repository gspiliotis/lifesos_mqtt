import { CMD_ROMVER } from '../Const';
import Response from '../Response';

/**
 * Response that provides the ROM version on the base unit.
 */
class ROMVersionResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName = CMD_ROMVER;

  /**
   * ROM version string.
   */
  readonly version: string;

  constructor(text: string) {
    super();

    this.version = text.slice(this.commandName.length);
  }
}

export default ROMVersionResponse;
