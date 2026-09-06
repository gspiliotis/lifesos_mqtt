import EventEmitter from 'events';
import * as log4js from 'log4js';
import { Socket } from 'net';
import ClearStatusCommand from '../src/Commands/ClearStatusCommand';
import GetDateTimeCommand from '../src/Commands/GetDateTimeCommand';
import ContactID from '../src/ContactId';
import DeviceEvent from '../src/DeviceEvent';
import CommandTimeoutError from '../src/Errors/CommandTimeoutError';
import { Protocol, State } from '../src/Protocol';
import ClearedStatusResponse from '../src/Responses/ClearedStatusResponse';
import DateTimeResponse from '../src/Responses/DateTimeResponse';
import DeviceAddedResponse from '../src/Responses/DeviceAddedResponse';
import DeviceAddingResponse from '../src/Responses/DeviceAddingResponse';
import DeviceChangedResponse from '../src/Responses/DeviceChangedResponse';
import DeviceDeletedResponse from '../src/Responses/DeviceDeletedResponse';
import DeviceInfoResponse from '../src/Responses/DeviceInfoResponse';
import DeviceNotFoundResponse from '../src/Responses/DeviceNotFoundResponse';
import EntryDelayResponse from '../src/Responses/EntryDelayResponse';
import EventLogNotFoundResponse from '../src/Responses/EventLogNotFoundResponse';
import EventLogResponse from '../src/Responses/EventLogResponse';
import ExitDelayResponse from '../src/Responses/ExitDelayResponse';
import OpModeResponse from '../src/Responses/OpModeResponse';
import ROMVersionResponse from '../src/Responses/ROMVersionResponse';

class ProtocolMock extends Protocol {
  constructor() {
    super();
  }

  get host(): string | undefined {
    return undefined;
  }

  get port(): number | undefined {
    return undefined;
  }
}

describe('Protocol', () => {
  let protocol: ProtocolMock;

  beforeEach(() => {
    protocol = new ProtocolMock();
  });

  test('constructor', () => {
    expect(protocol.socket).toBeInstanceOf(Socket);
    expect(protocol.socket.eventNames()).toEqual(['close', 'error', 'data', 'end', 'connect']);
  });

  describe('handleOnError', () => {
    test('calls handleOnError on socket error', () => {
      protocol['handleOnError'] = jest.fn();
      protocol.socket.emit('error', new Error());
      expect(protocol['handleOnError']).toHaveBeenNthCalledWith(1, expect.any(Error));
    });

    describe('calls onConnectionError when defined', () => {
      beforeEach(() => {
        protocol.onConnectionError = jest.fn();
      });

      test('with undefined as argument', () => {
        protocol['handleOnError']();
        expect(protocol.onConnectionError).toHaveBeenNthCalledWith(1, undefined);
      });

      test('with an error as argument', () => {
        protocol['handleOnError'](new Error());
        expect(protocol.onConnectionError).toHaveBeenNthCalledWith(1, new Error());
      });
    });
  });

  describe('handleOnConnect', () => {
    test('calls handleOnConnect on socket connect', () => {
      protocol['handleOnConnect'] = jest.fn();
      protocol.socket.emit('connect');
      expect(protocol['handleOnConnect']).toHaveBeenCalled();
    });

    test('sets _isConnected to true', () => {
      expect(protocol.isConnected).toBe(false);
      protocol['handleOnConnect']();
      expect(protocol.isConnected).toBe(true);
    });

    test('calls onConnectionMade when defined', () => {
      protocol.onConnectionMade = jest.fn();
      protocol['handleOnConnect']();

      expect(protocol.onConnectionMade).toHaveBeenCalled();
    });
  });

  describe('handleOnClose', () => {
    test('calls handleOnClose on socket close', () => {
      protocol['handleOnClose'] = jest.fn();
      protocol.socket.emit('close');
      expect(protocol['handleOnClose']).toHaveBeenCalled();
    });

    describe('calls onConnectionClose when defined', () => {
      beforeEach(() => {
        protocol.onConnectionClose = jest.fn();
      });

      test('with false as argument', () => {
        protocol['handleOnClose'](false);
        expect(protocol.onConnectionClose).toHaveBeenNthCalledWith(1, false);
      });

      test('with true as argument', () => {
        protocol['handleOnClose'](true);
        expect(protocol.onConnectionClose).toHaveBeenNthCalledWith(1, true);
      });
    });
  });

  describe('handleOnEnd', () => {
    test('calls handleOnEnd on socket error', () => {
      protocol['handleOnEnd'] = jest.fn();
      protocol.socket.emit('end');
      expect(protocol['handleOnEnd']).toHaveBeenCalled();
    });

    test('sets _isConnected to false', () => {
      protocol['handleOnConnect']();
      expect(protocol.isConnected).toBe(true);
      protocol['handleOnEnd']();
      expect(protocol.isConnected).toBe(false);
    });

    test('calls onConnectionEnd when defined', () => {
      protocol.onConnectionEnd = jest.fn();
      protocol['handleOnEnd']();
      expect(protocol.onConnectionEnd).toHaveBeenCalled();
    });
  });

  describe('handleOnData', () => {
    test('calls handleOnData on socket data', () => {
      protocol['handleOnData'] = jest.fn();
      protocol.socket.emit('data', 'foobar');
      expect(protocol['handleOnData']).toHaveBeenNthCalledWith(1, 'foobar');
    });

    /* eslint-disable-next-line jest/expect-expect */
    test('Only for coverage', () => {
      // Only for coverage as istanbul can't ignore else-if statements.
      protocol['handleOnData'](Buffer.from('XINPIC=\r\n', 'ascii'));
      protocol['handleOnData'](Buffer.from('[et]\r\n', 'ascii'));
      protocol['handleOnData'](Buffer.from('X10 ERR\r\n', 'ascii'));
      protocol['handleOnData'](Buffer.from('Something else\r\n', 'ascii'));
    });

    test('handles the line buffer when given an incomplete line', () => {
      protocol.onDeviceEvent = jest.fn();
      protocol['handleOnData'](Buffer.from('MINP', 'ascii'));
      protocol['handleOnData'](Buffer.from('IC=0000000000000000000000\r\n', 'ascii'));
      expect(protocol.onDeviceEvent).toHaveBeenNthCalledWith(1, expect.any(DeviceEvent));
    });

    describe('Device events', () => {
      test('calls onDeviceEvent when defined', () => {
        protocol.onDeviceEvent = jest.fn();
        protocol['handleOnData'](Buffer.from('MINPIC=0000000000000000000000\r\n', 'ascii'));

        expect(protocol.onDeviceEvent).toHaveBeenNthCalledWith(1, expect.any(DeviceEvent));
      });

      test('dont call onDeviceEvent when DeviceEvent creation throws', () => {
        protocol.onDeviceEvent = jest.fn();
        protocol['handleOnData'](Buffer.from('MINPIC=0\r\n', 'ascii'));

        expect(protocol.onDeviceEvent).not.toHaveBeenCalled();
      });
    });

    describe('Contact ID', () => {
      test('calls onContactId when defined', () => {
        protocol.onContactId = jest.fn();
        protocol['handleOnData'](Buffer.from('(1ac318138403110e)\r\n', 'ascii'));

        expect(protocol.onContactId).toHaveBeenNthCalledWith(1, expect.any(ContactID));
      });

      test('dont call onContactId when DeviceEvent creation throws', () => {
        const string = '(0)\r\n';
        protocol.onContactId = jest.fn();
        protocol['handleOnData'](Buffer.from(string, 'ascii'));

        expect(protocol.onContactId).not.toHaveBeenCalled();
      });
    });

    describe('Command responses', () => {
      const string = '!l5&\r\n'; // ClearedStatusResponse
      const state: State = { command: new ClearStatusCommand(), event: new EventEmitter() };
      let getExecutingMock: jest.Mock;

      beforeEach(() => {
        getExecutingMock = jest.fn();
        protocol.onResponse = jest.fn();
        Object.defineProperty(protocol, 'executing', { get: getExecutingMock });
      });

      test('not calls onResponse when command parse fails', () => {
        protocol['handleOnData'](Buffer.from('!0&\r\n', 'ascii'));

        expect(protocol.onResponse).not.toHaveBeenCalled();
      });

      test('emits to the state event', () => {
        const emitSpy = jest.spyOn(state.event, 'emit');
        getExecutingMock.mockReturnValue({ [state.command.name]: state });

        protocol['handleOnData'](Buffer.from(string, 'ascii'));

        expect(emitSpy).toHaveBeenCalledWith(state.command.name, expect.any(ClearedStatusResponse));
      });

      test('calls onResponse', () => {
        getExecutingMock.mockReturnValue({ [state.command.name]: state });

        protocol['handleOnData'](Buffer.from(string, 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(ClearedStatusResponse));
      });
    });

    describe('Command parsing', () => {
      beforeEach(() => {
        protocol.onResponse = jest.fn();
      });

      test('not call onResponse when response text is empty', () => {
        protocol['handleOnData'](Buffer.from('!&\r\n', 'ascii'));

        expect(protocol.onResponse).not.toHaveBeenCalled();
      });

      test('catch thrown error when response is not recognized', () => {
        protocol['handleOnData'](Buffer.from('!xx&\r\n', 'ascii'));

        expect(log4js.getLogger().error).toHaveBeenCalledWith('Failed to parse response', expect.any(Error));
      });

      test('calls onResponse with a DateTimeResponse', () => {
        protocol['handleOnData'](Buffer.from('!dt86042071200&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DateTimeResponse));
      });

      test('calls onResponse with a OpModeResponse', () => {
        protocol['handleOnData'](Buffer.from('!n08&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(OpModeResponse));
      });

      test('calls onResponse with a DeviceNotFoundResponse (K prefix) (RESPONSE_ERROR)', () => {
        protocol['handleOnData'](Buffer.from('!kbno&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceNotFoundResponse));
      });

      test('calls onResponse with a DeviceNotFoundResponse (K prefix) (00)', () => {
        protocol['handleOnData'](Buffer.from('!kb00&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceNotFoundResponse));
      });

      test('calls onResponse with a DeviceInfoResponse', () => {
        protocol['handleOnData'](Buffer.from('!kb50f01a7a0010e41102141000005b05&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceInfoResponse));
      });

      test('calls onResponse with a DeviceNotFoundResponse (i prefix)', () => {
        protocol['handleOnData'](Buffer.from('!ibno&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceNotFoundResponse));
      });

      test('calls onResponse with a DeviceAddingResponse', () => {
        protocol['handleOnData'](Buffer.from('!ibl&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceAddingResponse));
      });

      test('calls onResponse with a DeviceAddedResponse', () => {
        protocol['handleOnData'](Buffer.from('!ibl0511021410&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceAddedResponse));
      });

      test('calls onResponse with a DeviceChangedResponse', () => {
        protocol['handleOnData'](Buffer.from('!ibs0511021410&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceChangedResponse));
      });

      test('calls onResponse with a DeviceDeletedResponse', () => {
        protocol['handleOnData'](Buffer.from('!ibk01&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceDeletedResponse));
      });

      test('calls onResponse with a DeviceInfoResponse (i prefix)', () => {
        protocol['handleOnData'](Buffer.from('!ib0050f01a7a0010e41102141000005b05&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceInfoResponse));
      });

      test('calls onResponse with a ClearedStatusResponse', () => {
        protocol['handleOnData'](Buffer.from('!l5&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(ClearedStatusResponse));
      });

      test('calls onResponse with a ROMVersionResponse', () => {
        protocol['handleOnData'](Buffer.from('!vn123456&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(ROMVersionResponse));
      });

      test('calls onResponse with a ExitDelayResponse', () => {
        protocol['handleOnData'](Buffer.from('!l005&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(ExitDelayResponse));
      });

      test('calls onResponse with a EntryDelayResponse', () => {
        protocol['handleOnData'](Buffer.from('!l105&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(EntryDelayResponse));
      });

      test('calls onResponse with a EventLogNotFoundResponse', () => {
        protocol['handleOnData'](Buffer.from('!evno&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(EventLogNotFoundResponse));
      });

      test('calls onResponse with a EventLogResponse', () => {
        protocol['handleOnData'](Buffer.from('!ev344160000200112201520b7&\r\n', 'ascii'));

        expect(protocol.onResponse).toHaveBeenNthCalledWith(1, expect.any(EventLogResponse));
      });
    });

    describe('execute', () => {
      const isConnectedMock = jest.fn();
      beforeEach(() => {
        protocol.socket.write = jest.fn();
        Object.defineProperty(protocol, '_isConnected', { get: isConnectedMock });
      });

      test('writes to socket and clears the timeout', () => {
        isConnectedMock.mockReturnValue(true);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        const executePromise = protocol.execute(new GetDateTimeCommand());
        protocol['handleOnData'](Buffer.from('!dt86042071200&\r\n', 'ascii'));

        return executePromise.then(() => {
          expect(protocol.socket.write).toHaveBeenNthCalledWith(1, '!dt?&');
          expect(clearTimeoutSpy).toHaveBeenCalled();
        });
      });

      test('writes to socket with password', async () => {
        isConnectedMock.mockReturnValue(true);

        const executePromise = protocol.execute(new GetDateTimeCommand(), 'foobar');
        protocol['handleOnData'](Buffer.from('!dt86042071200&\r\n', 'ascii'));

        await executePromise;
        expect(protocol.socket.write).toHaveBeenNthCalledWith(1, '!dt?foobar&');
      });

      test('throws at timeout', async () => {
        expect.assertions(1);
        jest.useFakeTimers();
        isConnectedMock.mockReturnValue(true);

        const executePromise = protocol.execute(new GetDateTimeCommand());

        jest.runAllTimers();
        jest.useRealTimers();

        await expect(executePromise).rejects.toThrow(expect.any(CommandTimeoutError));
      });

      test('throws when protocol is not connected', async () => {
        isConnectedMock.mockReturnValue(false);

        await expect(protocol.execute(new GetDateTimeCommand(), '', 1)).rejects.toThrow(
          'Client is not connected to the server',
        );
      });
    });
  });
});
