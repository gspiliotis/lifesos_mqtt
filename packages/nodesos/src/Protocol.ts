import EventEmitter from 'events';
import * as log4js from 'log4js';
import { Socket } from 'net';
import Command from './Command';
import {
  ACTION_ADD,
  ACTION_DEL,
  ACTION_NONE,
  ACTION_SET,
  CMD_CLEAR_STATUS,
  CMD_DATETIME,
  CMD_DEVBYIDX_PREFIX,
  CMD_DEVICE_PREFIX,
  CMD_ENTRY_DELAY,
  CMD_EVENT_LOG,
  CMD_EXIT_DELAY,
  CMD_OPMODE,
  CMD_ROMVER,
  CMD_SENSOR_LOG,
  MARKER_END,
  MARKER_START,
  RESPONSE_ERROR,
} from './Const';
import ContactID from './ContactId';
import DeviceEvent from './DeviceEvent';
import CommandTimeoutError from './Errors/CommandTimeoutError';
import ConnectionError from './Errors/ConnectionError';
import Response from './Response';
import ClearedStatusResponse from './Responses/ClearedStatusResponse';
import DateTimeResponse from './Responses/DateTimeResponse';
import DeviceAddedResponse from './Responses/DeviceAddedResponse';
import DeviceAddingResponse from './Responses/DeviceAddingResponse';
import DeviceChangedResponse from './Responses/DeviceChangedResponse';
import DeviceDeletedResponse from './Responses/DeviceDeletedResponse';
import DeviceInfoResponse from './Responses/DeviceInfoResponse';
import DeviceNotFoundResponse from './Responses/DeviceNotFoundResponse';
import EntryDelayResponse from './Responses/EntryDelayResponse';
import EventLogNotFoundResponse from './Responses/EventLogNotFoundResponse';
import EventLogResponse from './Responses/EventLogResponse';
import ExitDelayResponse from './Responses/ExitDelayResponse';
import OpModeResponse from './Responses/OpModeResponse';
import ROMVersionResponse from './Responses/ROMVersionResponse';

const logger = log4js.getLogger('NodeSOS.Protocol');

export type State = {
  command: Command;
  event: EventEmitter;
  response?: Response;
};

/**
 * Base class containing common functionality for the Client implementation.
 */
export abstract class Protocol {
  static EXECUTE_TIMEOUT_SECS = 8;

  /**
   * The socket used to read and write data.
   */
  readonly socket: Socket;

  /**
   * Control password, if one has been assigned on the base unit.
   */
  password: string = '';

  /**
   * True if client is connected to server; otherwise, False.
   */
  private _isConnected: boolean = false;

  private recv_buffer: string = '';

  protected executing: Record<string, State> = {};

  /**
   * Called after a connection error event.
   */
  onConnectionError: ((err?: Error) => void) | undefined;

  /**
   * Called after a connection has been made.
   */
  onConnectionMade: (() => void) | undefined;

  /**
   * Called after a connection has been closed.
   */
  onConnectionClose: ((hadError: boolean) => void) | undefined;

  /**
   * Called after a connection has ended.
   */
  onConnectionEnd: (() => void) | undefined;

  /**
   * Called when a device event has been received.
   */
  onDeviceEvent: ((deviceEvent: DeviceEvent) => void) | undefined;

  /**
   * Called when a ContactID message has been received.
   */
  onContactId: ((contactId: ContactID) => void) | undefined;

  /**
   * Called when a response has been received.
   */
  onResponse: ((response: Response) => void) | undefined;

  protected constructor() {
    this.socket = new Socket();

    // Handle data received
    this.socket.on('data', (data) => {
      this.handleOnData(data);
    });

    // Handle errors
    this.socket.on('error', (err) => {
      this.handleOnError(err);
    });

    // Handle socket connect
    this.socket.on('connect', () => {
      this.handleOnConnect();
    });

    // Handle socket closed
    this.socket.on('close', (hadError) => {
      this.handleOnClose(hadError);
    });

    // Handle socket end
    this.socket.on('end', () => {
      this.handleOnEnd();
    });
  }

  /**
   * Host name or IP address for the LifeSOS server.
   */
  abstract get host(): string | undefined;

  /**
   * Port number for the LifeSOS server.
   */
  abstract get port(): number | undefined;

  /**
   * True if client is connected to server; otherwise, False.
   */
  get isConnected() {
    return this._isConnected;
  }

  protected handleOnError(err?: Error) {
    // Handle socket error event
    logger.error('Socket error:', err);

    if (this.onConnectionError) {
      this.onConnectionError(err);
    }
  }

  protected handleOnConnect() {
    // Handle socket connect event
    logger.info(`Socket connected to ${this.host}:${this.port}`);

    this._isConnected = true;

    // @TODO: Add ensure alive

    if (this.onConnectionMade) {
      this.onConnectionMade();
    }
  }

  protected handleOnClose(hadError: boolean) {
    // Handle socket close event
    logger.info(`Socket closed ${hadError ? 'with' : 'without'} error`);

    this._isConnected = false;

    if (this.onConnectionClose) {
      this.onConnectionClose(hadError);
    }
  }

  protected handleOnEnd() {
    // Handle socket close event
    logger.info('Disconnected');

    this._isConnected = false;

    if (this.onConnectionEnd) {
      this.onConnectionEnd();
    }
  }

  protected handleOnData(data: Buffer) {
    // We should only receive ASCII text. Anything that doesn't decode is
    // garbage; a sign the user may have a faulty cable between the base
    // unit and the serial-ethernet adapter (this happened to me!)
    const recv_chars = data.toString('ascii');

    // Data received will have CR/LF somewhat randomly at either the start or end
    // of each message. To deal with this, we'll append it to a running buffer and then
    // use every portion terminated by either character (ignoring blank strings).
    this.recv_buffer += recv_chars;
    const lines = this.recv_buffer.split(/\r?\n|\r|\n/g);
    const last_line = lines[lines.length - 1];

    if (last_line && this.recv_buffer.endsWith(last_line)) {
      // Last line with no CR/LF; keep in buffer for next call
      this.recv_buffer = last_line;
      lines.splice(lines.length - 1, 1);
    } else {
      this.recv_buffer = '';
    }

    for (const line of lines) {
      if (!line) {
        continue;
      }

      // Handle responses; these are given in response to a command issued, either
      // by us or another client (if multiple connections enabled on adapter)
      if (line.startsWith(MARKER_START) && line.endsWith(MARKER_END)) {
        let response;
        try {
          response = this.parse(line);
        } catch (error) {
          logger.error('Failed to parse response', error);
          continue;
        }

        if (response) {
          logger.debug(response);
          const state = this.executing[response.commandName];

          if (state) {
            if (state.command) {
              state.event.emit(state.command.name, response);
            }
          }

          if (this.onResponse) {
            this.onResponse(response);
          }
        }
      }
      // Handle device events; eg. sensor triggered, low battery, etc...
      else if (line.startsWith('MINPIC=')) {
        let device_event;

        try {
          device_event = new DeviceEvent(line);
        } catch (error) {
          logger.error('Failed to parse device event', error);
        }

        logger.debug(device_event);

        if (this.onDeviceEvent && device_event) {
          this.onDeviceEvent(device_event);
        }
      }
      // Ademco ® Contact ID protocol
      else if (line.startsWith('(') && line.endsWith(')')) {
        let contact_id;
        try {
          contact_id = new ContactID(line.substring(1, line.length - 1));
        } catch (error) {
          logger.error('Failed to parse ContactID: ', error);
        }

        logger.debug(contact_id);

        if (this.onContactId && contact_id) {
          this.onContactId(contact_id);
        }
      }
      // Events from devices that haven't been enrolled, as well as a
      // display event from the base unit providing details to be shown.
      // Ignoring them as we have no interest in either.
      /* eslint-disable-next-line no-empty */
      else if (line.startsWith('XINPIC=')) {
      }
      // New sensor log entry; superfluous given device events already
      // provide us with this information, so just ignore them
      /* eslint-disable-next-line no-empty */
      else if (line.startsWith('[' + CMD_SENSOR_LOG) && line.endsWith(']')) {
      }
      // Failure to trigger an X10 switch
      /* eslint-disable-next-line no-empty */
      else if (line === 'X10 ERR') {
      }
      // Any unrecognised messages; ignore them too...
      /* eslint-disable-next-line no-empty */
      else {
      }
    }
  }

  private parse(text: string): Response | null | undefined {
    // Trim the start and end markers, and ensure only lowercase is used
    text = text.substring(1, text.length - 1).toLowerCase();

    // No-op; can just ignore these
    if (!text) {
      return null;
    }

    if (text.startsWith(CMD_DATETIME)) {
      return new DateTimeResponse(text);
    } else if (text.startsWith(CMD_OPMODE)) {
      return new OpModeResponse(text);
    } else if (text.startsWith(CMD_DEVBYIDX_PREFIX)) {
      if (RESPONSE_ERROR === text.slice(2) || text.slice(2, 4) === '00') {
        return new DeviceNotFoundResponse(text);
      }
      return new DeviceInfoResponse(text);
    } else if (text.startsWith(CMD_DEVICE_PREFIX)) {
      const action = [ACTION_ADD, ACTION_DEL, ACTION_SET].find((a) => a === text.slice(2, 3)) || ACTION_NONE;
      const args = text.slice(2 + action.length);

      if (RESPONSE_ERROR === args) {
        return new DeviceNotFoundResponse(text);
      } else if (action === ACTION_ADD) {
        if (!args) {
          return new DeviceAddingResponse(text);
        }
        return new DeviceAddedResponse(text);
      } else if (action === ACTION_SET) {
        return new DeviceChangedResponse(text);
      } else if (action === ACTION_DEL) {
        return new DeviceDeletedResponse(text);
      } else {
        return new DeviceInfoResponse(text);
      }
    } else if (text.startsWith(CMD_CLEAR_STATUS)) {
      return new ClearedStatusResponse();
    } else if (text.startsWith(CMD_ROMVER)) {
      return new ROMVersionResponse(text);
    } else if (text.startsWith(CMD_EXIT_DELAY)) {
      return new ExitDelayResponse(text);
    } else if (text.startsWith(CMD_ENTRY_DELAY)) {
      return new EntryDelayResponse(text);
    } else if (text.startsWith(CMD_EVENT_LOG)) {
      if (RESPONSE_ERROR === text.slice(2)) {
        return new EventLogNotFoundResponse();
      }
      return new EventLogResponse(text);
    } else {
      throw new Error(`Response not recognised: ${text}`);
    }
  }

  /**
   * Execute a command and return response.
   *
   * @param command the command instance to be executed.
   * @param password if specified, will be used to execute this command
   *   (overriding any global password that may have been assigned to the
   *   property).
   * @param timeout maximum number of seconds to wait for a response.
   */
  async execute<R extends Response>(
    command: Command,
    password: string = '',
    timeout: number = Protocol.EXECUTE_TIMEOUT_SECS,
  ): Promise<R> {
    if (!this._isConnected) {
      throw new ConnectionError('Client is not connected to the server');
    }

    const state = {
      command: command,
      event: new EventEmitter(),
    } satisfies State;

    this.executing[command.name] = state;

    const response = new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new CommandTimeoutError(command));
      }, timeout * 1000);

      state.event.once(command.name, (data: R) => {
        clearTimeout(timer);
        resolve(data);
      });
    }).finally(() => {
      logger.debug(`Deleting command: ${command.name}`);
      delete this.executing[command.name];
    });

    this._send(command, password);

    return response;
  }

  private _send(command: Command, password: string) {
    // When no password specified on this call, use global password
    if (password === '') {
      password = this.password;
    }

    const command_text = command.format(password);

    this.socket!.write(command_text);

    const command_hidepwd = command.format('*'.repeat(password.length));
    logger.debug(`DataSent: ${command_hidepwd}`);
  }
}
