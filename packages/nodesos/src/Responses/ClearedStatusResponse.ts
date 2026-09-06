import { CMD_CLEAR_STATUS } from '../Const';
import Response from '../Response';

/**
 * Response that indicates status was cleared on base unit.
 */
class ClearedStatusResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName = CMD_CLEAR_STATUS;
}

export default ClearedStatusResponse;
