import Client from '../src/Client';

describe('Client', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client(8080, '120.0.0.1');
    client.socket.connect = jest.fn();
  });

  test('constructor', () => {
    expect(client.port).toBe(8080);
    expect(client.host).toBe('120.0.0.1');
  });

  describe('open', () => {
    test('success', async () => {
      const connectionPromise = client.open();
      client.socket.emit('connect');

      await expect(connectionPromise).resolves.toBeUndefined();
    });

    test('failure', async () => {
      const connectionPromise = client.open();
      client.socket.emit('error');

      await expect(connectionPromise).rejects.toBeUndefined();
    });
  });

  describe('close', () => {
    test('success', async () => {
      client.socket.end = jest.fn();
      const closePromise = client.close();
      client.socket.emit('close');

      await expect(closePromise).resolves.toBeUndefined();
    });

    test('failure', async () => {
      const closePromise = client.close();
      client.socket.emit('error');

      await expect(closePromise).rejects.toBeUndefined();
    });

    test('close when socket already is closed', async () => {
      client.socket.end = jest.fn();
      client.socket.destroy();

      const closePromise = client.close();
      await expect(closePromise).resolves.toBeUndefined();
      expect(client.socket.end).not.toHaveBeenCalled();
    });
  });

});
