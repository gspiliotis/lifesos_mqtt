import { CMD_DATETIME } from '../../src/Const';
import DateTimeResponse from '../../src/Responses/DateTimeResponse';

describe('DateTimeResponse', () => {
  describe('when responding to ACTION_SET', () => {
    let response: DateTimeResponse;
    beforeAll(() => {
      response = new DateTimeResponse('dts86042071200');
    });

    test('constructor', () => {
      expect(response.wasSet).toBe(true);
      expect(response.remoteDatetime).toBe('1986-04-20T12:00:00.000');
      expect(response.commandName).toEqual(CMD_DATETIME);
    });

    test('fails when text length is not exactly 11', () => {
      expect(() => new DateTimeResponse('dts860420712')).toThrow(
        "Date/Time response length is invalid. Got '860420712'",
      );
    });
  });

  describe('when responding to ACTION_GET', () => {
    let response: DateTimeResponse;
    beforeAll(() => {
      response = new DateTimeResponse('dt86042071200');
    });

    test('constructor', () => {
      expect(response.wasSet).toBe(false);
      expect(response.remoteDatetime).toBe('1986-04-20T12:00:00.000');
      expect(response.commandName).toEqual(CMD_DATETIME);
    });

    test('fails when text length is not exactly 11', () => {
      expect(() => new DateTimeResponse('dt860420712')).toThrow(
        "Date/Time response length is invalid. Got '860420712'",
      );
    });
  });
});
