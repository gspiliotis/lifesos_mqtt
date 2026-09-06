import DeviceEvent from '../src/DeviceEvent';
import { DCFlags, DeviceEventCode, DeviceType, FlagEnum, IntEnum } from '../src/Enums';

const line = 'MINPIC=0a404020fccd00109a4fff';
describe('Device Event', () => {
  test('constructor', () => {
    const response = new DeviceEvent(line);
    expect(response.currentStatus).toBe(154);
    expect(response.deviceCharacteristics).toEqual(new FlagEnum(DCFlags, DCFlags.RFVoice | DCFlags.Reserved_b1));
    expect(response.deviceId).toBe(2161869);
    expect(response.deviceType).toEqual(new IntEnum(DeviceType, DeviceType.DoorMagnet));
    expect(response.eventCode).toEqual(new IntEnum(DeviceEventCode, DeviceEventCode.Open));
    expect(response.messageAttribute).toBe(0);
    expect(response.RSSIBars).toBe(4);
    expect(response.RSSIDb).toBe(90);
  });

  test('constructor fails when text length < 19', () => {
    expect(() => new DeviceEvent('MINPIC=0')).toThrow('Event length is invalid.');
  });

  describe('RSSIBars', () => {
    let response: DeviceEvent;
    let spy: jest.SpyInstance;

    beforeAll(() => {
      response = new DeviceEvent('MINPIC=0000000000000000000000');
      spy = jest.spyOn(response, 'RSSIDb', 'get');
    });

    test('returns 0', () => {
      // spy.mockReturnValue(40);
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
    let response: DeviceEvent;
    let mock: jest.Mock;

    beforeAll(() => {
      response = new DeviceEvent('MINPIC=1000000000000000000000');
      mock = jest.fn();
      Object.defineProperty(response, 'currentStatus', { get: mock });
    });

    test('returns 01', () => {
      mock.mockReturnValue(-20);
      expect(response.RSSIDb).toBe(0);
    });

    test('returns 101', () => {
      mock.mockReturnValue(70);
      expect(response.RSSIDb).toBe(6);
    });

    test('returns 991', () => {
      mock.mockReturnValue(1000);
      expect(response.RSSIDb).toBe(99);
    });
  });
});
