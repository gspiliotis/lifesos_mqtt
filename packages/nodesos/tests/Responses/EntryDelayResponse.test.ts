import { CMD_ENTRY_DELAY } from '../../src/Const';
import EntryDelayResponse from '../../src/Responses/EntryDelayResponse';

describe('EntryDelayResponse', () => {
  describe('when responding to ACTION_SET', () => {
    let response: EntryDelayResponse;
    beforeAll(() => {
      response = new EntryDelayResponse('l1s06');
    });

    test('constructor', () => {
      expect(response.wasSet).toBe(true);
      expect(response.entryDelay).toBe(6);
      expect(response.commandName).toEqual(CMD_ENTRY_DELAY);
    });
  });

  describe('when responding to ACTION_GET', () => {
    let response: EntryDelayResponse;
    beforeAll(() => {
      response = new EntryDelayResponse('l106');
    });

    test('constructor', () => {
      expect(response.wasSet).toBe(false);
      expect(response.entryDelay).toBe(6);
      expect(response.commandName).toEqual(CMD_ENTRY_DELAY);
    });
  });
});
