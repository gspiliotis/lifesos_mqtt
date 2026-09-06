import { CMD_DEVICE_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import { ESFlags, FlagEnum } from '../../src/Enums';
import DeviceSettingsResponse from '../../src/Responses/DeviceSettingsResponse';

class MockedClass extends DeviceSettingsResponse {
  constructor(text: string) {
    super(text);
  }
}

describe('DeviceSettingsResponse', () => {
  test('constructor', () => {
    const response = new MockedClass('ib?0511021410');
    expect(response.commandName).toEqual(CMD_DEVICE_PREFIX + DC_BURGLAR.code);
    expect(response.deviceCategory).toEqual(DC_BURGLAR);
    expect(response.enableStatus).toEqual(
      new FlagEnum(ESFlags, ESFlags.HomeGuard | ESFlags.AlarmSiren | ESFlags.Supervised),
    );
    expect(response.groupNumber).toBe(17);
    expect(response.index).toBe(5);
    expect(response.unitNumber).toBe(2);
    expect(response.zone).toBe('11-02');
  });

  describe('zone', () => {
    let response: DeviceSettingsResponse;
    let groupMock: jest.Mock;
    let unitMock: jest.Mock;

    beforeAll(() => {
      response = new MockedClass('');
      groupMock = jest.fn();
      unitMock = jest.fn();
      Object.defineProperty(response, 'groupNumber', { get: groupMock });
      Object.defineProperty(response, 'unitNumber', { get: unitMock });
    });

    test('returns 00-00', () => {
      groupMock.mockReturnValue(0);
      unitMock.mockReturnValue(0);
      expect(response.zone).toBe('00-00');
    });

    test('returns 11-20', () => {
      groupMock.mockReturnValue(17);
      unitMock.mockReturnValue(20);
      expect(response.zone).toBe('11-14');
    });
  });
});
