import { CMD_CLEAR_STATUS } from '../../src/Const';
import ClearedStatusResponse from '../../src/Responses/ClearedStatusResponse';

test('ClearedStatusResponse', () => {
  const response = new ClearedStatusResponse();
  expect(response.commandName).toEqual(CMD_CLEAR_STATUS);
});
