import { CMD_DEVICE_PREFIX } from '../../src/Const';
import { DC_BURGLAR } from '../../src/DeviceCategory';
import { DCFlags, DeviceType, ESFlags, FlagEnum, IntEnum } from '../../src/Enums';
import DeviceInfoResponse from '../../src/Responses/DeviceInfoResponse';

describe('DeviceInfoResponse', () => {
  test('constructor', () => {
    const response = new DeviceInfoResponse('ib0050f01a7a0010e41102141000005b05');
    expect(response.commandName).toEqual(CMD_DEVICE_PREFIX + DC_BURGLAR.code);
    expect(response.currentStatus).toBe(91);
    expect(response.deviceCategory).toEqual(DC_BURGLAR);
    expect(response.deviceCharacteristics).toEqual(new FlagEnum(DCFlags, DCFlags.Supervisory));
    expect(response.deviceId).toBe(15735418);
    expect(response.deviceType).toEqual(new IntEnum(DeviceType, DeviceType.PIRSensor));
    expect(response.downCount).toBe(5);
    expect(response.enableStatus).toEqual(
      new FlagEnum(ESFlags, ESFlags.HomeGuard | ESFlags.AlarmSiren | ESFlags.Supervised),
    );
    expect(response.groupNumber).toBe(17);
    expect(response.index).toBe(0);
    expect(response.messageAttribute).toBe(0);
    expect(response.unitNumber).toBe(2);
    expect(response.RSSIBars).toBe(0);
    expect(response.RSSIDb).toBe(27);
    expect(response.zone).toBe('11-02');
  });

  describe('RSSIBars', () => {
    let response: DeviceInfoResponse;
    let spy: jest.SpyInstance;

    beforeAll(() => {
      response = new DeviceInfoResponse('');
      spy = jest.spyOn(response, 'RSSIDb', 'get');
    });

    test('returns 0', () => {
      spy.mockReturnValue(40);
      expect(response.RSSIBars).toBe(0);
    });

    test('returns 1', () => {
      spy.mockReturnValue(50);
      expect(response.RSSIBars).toBe(1);
    });

    test('returns 2', () => {
      spy.mockReturnValue(70);
      expect(response.RSSIBars).toBe(2);
    });

    test('returns 3', () => {
      spy.mockReturnValue(80);
      expect(response.RSSIBars).toBe(3);
    });

    test('returns 4', () => {
      spy.mockReturnValue(99);
      expect(response.RSSIBars).toBe(4);
    });
  });

  describe('RSSIDb', () => {
    let response: DeviceInfoResponse;
    let mock: jest.Mock;

    beforeAll(() => {
      response = new DeviceInfoResponse('');
      mock = jest.fn();
      Object.defineProperty(response, 'currentStatus', { get: mock });
    });

    test('returns 0', () => {
      mock.mockReturnValue(-20);
      expect(response.RSSIDb).toBe(0);
    });

    test('returns 10', () => {
      mock.mockReturnValue(70);
      expect(response.RSSIDb).toBe(6);
    });

    test('returns 99', () => {
      mock.mockReturnValue(1000);
      expect(response.RSSIDb).toBe(99);
    });
  });

  describe('zone', () => {
    let response: DeviceInfoResponse;
    let groupMock: jest.Mock;
    let unitMock: jest.Mock;

    beforeAll(() => {
      response = new DeviceInfoResponse('');
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

  describe('isClosed', () => {
    let response: DeviceInfoResponse;
    let typeMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeAll(() => {
      response = new DeviceInfoResponse('');
      typeMock = jest.fn();
      statusMock = jest.fn();
      Object.defineProperty(response, 'deviceType', { get: typeMock });
      Object.defineProperty(response, 'currentStatus', { get: statusMock });
    });

    test('returns null', () => {
      typeMock.mockReturnValue(new IntEnum(DeviceType, 1337));
      expect(response.isClosed).toBeUndefined();
    });

    test('returns true', () => {
      typeMock.mockReturnValue(new IntEnum(DeviceType, DeviceType.DoorMagnet));
      statusMock.mockReturnValue(1);
      expect(response.isClosed).toBe(true);
    });

    test('returns false', () => {
      typeMock.mockReturnValue(new IntEnum(DeviceType, DeviceType.DoorMagnet));
      statusMock.mockReturnValue(0);
      expect(response.isClosed).toBe(false);
    });
  });
});
