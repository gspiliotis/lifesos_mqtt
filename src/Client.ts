import { Protocol } from './Protocol';

/**
 * Provides connectivity to a LifeSOS ethernet adapter that is configured
 * in TCP Server mode.
 */
class Client extends Protocol {
  /**
   * @inheritDoc
   */
  readonly host: string | undefined;

  /**
   * @inheritDoc
   */
  readonly port: number;

  constructor(port: number, host?: string) {
    super();
    this.host = host;
    this.port = port;
  }

  /**
   * Opens connection to the LifeSOS ethernet interface.
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.once('connect', () => {
        resolve();
      });

      this.socket.once('error', (err) => {
        reject(err);
      });

      this.socket.connect({ port: this.port, host: this.host });
    });
  }

  /**
   * Close connection to the LifeSOS ethernet interface.
   */
  async close(): Promise<void> {
    if (this.socket.closed) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.socket.once('close', () => {
        resolve();
      });

      this.socket.once('error', (error: Error) => {
        reject(error);
      });

      this.socket.end();
    });
  }
}

export default Client;
