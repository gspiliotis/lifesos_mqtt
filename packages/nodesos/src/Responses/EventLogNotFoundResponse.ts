import { CMD_EVENT_LOG } from '../Const';
import Response from '../Response';

/**
 * Response that indicates there was no entry in event log at specified index.
 */
class EventLogNotFoundResponse extends Response {
  /**
   * @inheritDoc
   */
  readonly commandName = CMD_EVENT_LOG;
}

export default EventLogNotFoundResponse;
