import { CMD_EXIT_DELAY } from '../../src/Const';
import ExitDelayResponse from '../../src/Responses/ExitDelayResponse';

describe('ExitDelayResponse', () => {
  describe('when responding to ACTION_SET', () => {
    let response: ExitDelayResponse;
    beforeAll(() => {
      response = new ExitDelayResponse('l0s05');
    });

    test('constructor', () => {
      expect(response.wasSet).toBe(true);
      expect(response.exitDelay).toBe(5);
      expect(response.commandName).toEqual(CMD_EXIT_DELAY);
    });
  });

  describe('when responding to ACTION_GET', () => {
    let response: ExitDelayResponse;
    beforeAll(() => {
      response = new ExitDelayResponse('l005');
    });

    test('constructor', () => {
      expect(response.wasSet).toBe(false);
      expect(response.exitDelay).toBe(5);
      expect(response.commandName).toBe(CMD_EXIT_DELAY);
    });
  });
});
