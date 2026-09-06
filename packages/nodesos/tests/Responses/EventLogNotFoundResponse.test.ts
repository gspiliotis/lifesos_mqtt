import { CMD_EVENT_LOG } from '../../src/Const';
import EventLogNotFoundResponse from '../../src/Responses/EventLogNotFoundResponse';

test('EventLogNotFoundResponse', () => {
  const response = new EventLogNotFoundResponse();
  expect(response.commandName).toEqual(CMD_EVENT_LOG);
});
