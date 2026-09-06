import { CMD_OPMODE } from '../../src/Const';
import { IntEnum, OperationMode } from '../../src/Enums';
import OpModeResponse from '../../src/Responses/OpModeResponse';

describe('OpModeResponse', () => {
  describe('when responding to ACTION_SET', () => {
    let response: OpModeResponse;
    beforeAll(() => {
      response = new OpModeResponse(`n0s${OperationMode.Disarm}`);
    });

    test('constructor', () => {
      expect(response.wasSet).toBe(true);
      expect(response.operationMode).toEqual(new IntEnum(OperationMode, OperationMode.Disarm));
      expect(response.commandName).toEqual(CMD_OPMODE);
    });
  });

  describe('when responding to ACTION_GET', () => {
    let response: OpModeResponse;
    beforeAll(() => {
      response = new OpModeResponse(`n0${OperationMode.Monitor}`);
    });

    test('constructor', () => {
      expect(response.wasSet).toBe(false);
      expect(response.operationMode).toEqual(new IntEnum(OperationMode, OperationMode.Monitor));
      expect(response.commandName).toEqual(CMD_OPMODE);
    });
  });
});
