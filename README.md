# NodeSOS

[![Version][version-shield]][npm-link]
[![License][license-shield]](LICENSE.md)
[![Type definitions][type-definitions-shield]][npm-link]

A Nodejs module to communicate with [LifeSOS](http://lifesos.com.tw)
alarm systems. In some markets, they may also be labelled under the name
of the distributor; e.g. SecurePro in Australia, WeBeHome in northern
Europe.

It was written for & tested with the LS-20/LS-30 model, though it should also
work on the LS-10 model.

The base unit must be connected to your network in order for this
library to communicate with it; serial connections are not currently
supported.

*Special devices and device switches are not support as I don't have any special
devices nor using the device switches.*

---

When using this library in your app there are two main classes to
choose from:

### BaseUnit

Provides higher level access to the alarm system, managing the Client
connection for you. It will automatically enumerate all
attached devices on connection and monitor the state of the base unit
and devices with notification when they change.

### Client

The Client allows you to directly issue commands to the alarm
system, and attach callbacks to handle any events if needed.

##### Simple Client Examples

###### Display the current operation mode

```typescript
import { Client, GetOpModeCommand, OpModeResponse } from 'nodesos';

(async () => {
  const client = new Client(1680, '192.168.1.100');
  await client.open();

  const response = await client.execute<OpModeResponse>(new GetOpModeCommand());

  console.log(`Operation mode is ${response.operation_mode}`);

  await client.close();
  process.exit(0);
})();
```

###### Arm the system

```typescript
import { Client, SetOpModeCommand, OpModeResponse } from 'nodesos';

(async () => {
  const client = new Client(1680, '192.168.1.100');
  await client.open();

  const response = await client.execute<OpModeResponse>(new SetOpModeCommand());

  await client.close();
  process.exit(0);
})();
```

---

This project is heavily inspired by the [LifeSOSpy](https://github.com/rorr73/LifeSOSpy)
project by rorr73.

[license-shield]: https://img.shields.io/npm/l/nodesos
[npm-link]: https://img.shields.io/npm/v/nodesos
[type-definitions-shield]: https://img.shields.io/npm/types/nodesos
[version-shield]: https://img.shields.io/npm/v/nodesos
