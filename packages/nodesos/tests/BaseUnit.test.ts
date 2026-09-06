import * as log4js from 'log4js';
import { DateTime } from 'luxon';
import { BaseUnit } from '../src/BaseUnit';
import { ContactIdBuilder, DeviceInfoResponseBuilder } from './Builders';
import Client from '../src/Client';
import Command from '../src/Command';
import AddDeviceCommand from '../src/Commands/AddDeviceCommand';
import ChangeDeviceCommand from '../src/Commands/ChangeDeviceCommand';
import ClearStatusCommand from '../src/Commands/ClearStatusCommand';
import DeleteDeviceCommand from '../src/Commands/DeleteDeviceCommand';
import GetDateTimeCommand from '../src/Commands/GetDateTimeCommand';
import GetDeviceByIndexCommand from '../src/Commands/GetDeviceByIndexCommand';
import GetDeviceCommand from '../src/Commands/GetDeviceCommand';
import GetEntryDelayCommand from '../src/Commands/GetEntryDelayCommand';
import GetEventLogCommand from '../src/Commands/GetEventLogCommand';
import GetExitDelayCommand from '../src/Commands/GetExitDelayCommand';
import GetOpModeCommand from '../src/Commands/GetOpModeCommand';
import GetROMVersionCommand from '../src/Commands/GetROMVersionCommand';
import SetDateTimeCommand from '../src/Commands/SetDateTimeCommand';
import SetOpModeCommand from '../src/Commands/SetOpModeCommand';
import Device from '../src/Device';
import { DC_ALL, DC_CONTROLLER } from '../src/DeviceCategory';
import DeviceEvent from '../src/DeviceEvent';
import { BaseUnitState, ContactIDEventCode, ContactIDEventQualifier, ESFlags, IntEnum, OperationMode } from '../src/Enums';
import PropertyChangedInfo from '../src/PropertyChangedInfo';
import ClearedStatusResponse from '../src/Responses/ClearedStatusResponse';
import DateTimeResponse from '../src/Responses/DateTimeResponse';
import DeviceAddedResponse from '../src/Responses/DeviceAddedResponse';
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
import exp = require('constants');

jest.mock('../src/Client');

describe('BaseUnit', () => {
  let baseUnit: BaseUnit;
  let executeSpy: jest.SpyInstance;

  beforeEach(() => {
    baseUnit = new BaseUnit();
    executeSpy = jest.spyOn(Client.prototype, 'execute');
    executeSpy.mockImplementation(() => Promise.resolve());
  });

  test('start', () => {
    baseUnit.start();

    expect(Client.prototype.open).toHaveBeenCalled();
  });

  test('stop', () => {
    baseUnit.stop();

    expect(Client.prototype.close).toHaveBeenCalled();
  });

  describe('password', () => {
    test('get password', () => {
      baseUnit.protocol.password = 'foobar';
      expect(baseUnit.password).toEqual('foobar');
    });

    test('set password', () => {
      baseUnit.password = 'foobar';
      expect(baseUnit.protocol.password).toEqual('foobar');
    });
  });

  describe('clearStatus', () => {
    test('without password', () => {
      baseUnit.clearStatus();

      expect(executeSpy).toHaveBeenNthCalledWith(1, new ClearStatusCommand(), undefined);
    });

    test('with password', () => {
      baseUnit.clearStatus('foobar');

      expect(executeSpy).toHaveBeenNthCalledWith(1, new ClearStatusCommand(), 'foobar');
    });
  });

  test('addDevice', () => {
    baseUnit.addDevice(DC_CONTROLLER);

    expect(executeSpy).toHaveBeenNthCalledWith(1, new AddDeviceCommand(DC_CONTROLLER));
  });

  describe('changeDevice', () => {
    let device: Device;
    beforeEach(() => {
      device = new Device(new DeviceInfoResponse('ib0050f01a7a0010e41102141000005b05'));
      device.handleResponse = jest.fn();
      baseUnit.devices.set(device.deviceId, device);
    });

    test('dont call execute if device is missing from the device list', () => {
      baseUnit.changeDevice(1, 5, 5, ESFlags.Supervised);

      expect(executeSpy).not.toHaveBeenCalled();
    });

    test('throw if device exists in the list but cant be found on the baseunit', async () => {
      executeSpy.mockResolvedValue(new DeviceNotFoundResponse('ibno'));

      await expect(baseUnit.changeDevice(device.deviceId, 5, 5, ESFlags.Supervised)).rejects.toThrow(
        'Device to be changed was not found',
      );
      expect(executeSpy).toHaveBeenNthCalledWith(1, expect.any(GetDeviceCommand));
    });

    test('executes change command and calls device.handleResponse', async () => {
      executeSpy
        .mockResolvedValueOnce(new DeviceInfoResponse('ib0050f01a7a0010e41102141000005b05'))
        .mockResolvedValueOnce(new DeviceChangedResponse('ibs0511021410'));

      await baseUnit.changeDevice(device.deviceId, 5, 5, ESFlags.Supervised);

      expect(executeSpy).toHaveBeenNthCalledWith(2, expect.any(ChangeDeviceCommand));
      expect(device.handleResponse).toHaveBeenNthCalledWith(1, expect.any(DeviceChangedResponse));
    });
  });

  describe('deleteDevice', () => {
    let device: Device;
    beforeEach(() => {
      device = new Device(new DeviceInfoResponse('ib0050f01a7a0010e41102141000005b05'));
      baseUnit.devices.set(device.deviceId, device);
    });

    test('dont call execute if device is missing from the device list', () => {
      baseUnit.deleteDevice(1);

      expect(executeSpy).not.toHaveBeenCalled();
    });

    test('throw if device exists in the list but cant be found on the baseunit', async () => {
      executeSpy.mockResolvedValue(new DeviceNotFoundResponse('ibno'));

      await expect(baseUnit.deleteDevice(device.deviceId)).rejects.toThrow('Device to be deleted was not found');
      expect(executeSpy).toHaveBeenNthCalledWith(1, expect.any(GetDeviceCommand));
    });

    test('executes delete command', async () => {
      executeSpy
        .mockResolvedValueOnce(new DeviceInfoResponse('ib0050f01a7a0010e41102141000005b05'))
        .mockResolvedValueOnce(new DeviceDeletedResponse('ibk01'));

      await baseUnit.deleteDevice(device.deviceId);

      expect(executeSpy).toHaveBeenNthCalledWith(2, expect.any(DeleteDeviceCommand));
    });

    describe('onDeviceDeleted', () => {
      beforeEach(() => {
        executeSpy
          .mockResolvedValueOnce(new DeviceInfoResponse('ib0050f01a7a0010e41102141000005b05'))
          .mockResolvedValueOnce(new DeviceDeletedResponse('ibk01'));
      });

      test('Calls onDeviceDeleted', async () => {
        baseUnit.onDeviceDeleted = jest.fn();

        await baseUnit.deleteDevice(device.deviceId);

        expect(baseUnit.onDeviceDeleted).toHaveBeenNthCalledWith(1, expect.any(Device));
      });

      test('Catches errors from onDeviceDeleted', async () => {
        baseUnit.onDeviceDeleted = jest.fn().mockImplementation(() => {
          throw new Error();
        });

        await baseUnit.deleteDevice(device.deviceId);

        expect(log4js.getLogger().error).toHaveBeenCalledWith('Unhandled exception in onDeviceDeleted callback');
      });
    });
  });

  describe('getDatetime', () => {
    test('with result', async () => {
      executeSpy.mockResolvedValue(new DateTimeResponse('dt86042071200'));

      await expect(baseUnit.getDatetime()).resolves.toBe('1986-04-20T12:00:00.000');
      expect(executeSpy).toHaveBeenNthCalledWith(1, new GetDateTimeCommand());
    });
  });

  describe('getEventLog', () => {
    test('with result', async () => {
      executeSpy.mockResolvedValue(new EventLogResponse('ev138413010901112201260b7'));

      await expect(baseUnit.getEventLog(1)).resolves.toEqual(new EventLogResponse('ev138413010901112201260b7'));
      expect(executeSpy).toHaveBeenNthCalledWith(1, new GetEventLogCommand(1));
    });

    test('without result (undefined)', async () => {
      executeSpy.mockResolvedValue(new EventLogNotFoundResponse());

      await expect(baseUnit.getEventLog(1)).resolves.toBeUndefined();
    });
  });

  test('setDatetime', () => {
    const dateTime = DateTime.local(1986, 4, 20, 12, 30);
    baseUnit.setDatetime(dateTime);

    expect(executeSpy).toHaveBeenNthCalledWith(1, new SetDateTimeCommand(dateTime));
  });

  describe('setOperationMode', () => {
    test('without password', () => {
      baseUnit.setOperationMode(OperationMode.Monitor);

      expect(executeSpy).toHaveBeenNthCalledWith(1, new SetOpModeCommand(OperationMode.Monitor), undefined);
    });

    test('with password', () => {
      baseUnit.setOperationMode(OperationMode.Monitor, 'foobar');

      expect(executeSpy).toHaveBeenNthCalledWith(1, new SetOpModeCommand(OperationMode.Monitor), 'foobar');
    });
  });

  test('handleConnectionMade', () => {
    baseUnit['getInitialState'] = jest.fn();
    baseUnit['isConnected'] = false;
    baseUnit['handleConnectionMade']();

    expect(baseUnit.isConnected).toBe(true);
    expect(baseUnit['getInitialState']).toHaveBeenCalled();
  });

  test('handleConnectionClose with error', () => {
    baseUnit['isConnected'] = true;
    baseUnit['handleConnectionClose'](true);

    expect(baseUnit.isConnected).toBe(false);
  });

  test('handleConnectionClose without errors', () => {
    baseUnit['isConnected'] = true;
    baseUnit['handleConnectionClose'](false);

    expect(baseUnit.isConnected).toBe(false);
  });

  test('getInitialState', async () => {
    const executeRetryMock = jest.fn();
    baseUnit['executeRetry'] = executeRetryMock;

    executeRetryMock.mockImplementation((command: Command) => {
      if (command instanceof GetDeviceByIndexCommand) {
        if (command.index === 1) {
          return new DeviceNotFoundResponse(`k${command.deviceCategory.code}no`);
        }
        return new DeviceInfoResponse(`k${command.deviceCategory.code}0${command.index}12345${command.index}`);
      }
    });

    await baseUnit['getInitialState']();

    expect(executeRetryMock).toHaveBeenNthCalledWith(1, expect.any(GetROMVersionCommand), expect.any(String));
    expect(executeRetryMock).toHaveBeenNthCalledWith(2, expect.any(GetOpModeCommand), expect.any(String));
    expect(executeRetryMock).toHaveBeenNthCalledWith(3, expect.any(GetExitDelayCommand), expect.any(String));
    expect(executeRetryMock).toHaveBeenNthCalledWith(4, expect.any(GetEntryDelayCommand), expect.any(String));

    let calls = 5;
    for (const category of DC_ALL) {
      if (!category.maxDevices) {
        continue;
      }
      expect(executeRetryMock).toHaveBeenNthCalledWith(
        calls++,
        new GetDeviceByIndexCommand(category, 0),
        expect.any(String),
      );
      expect(executeRetryMock).toHaveBeenNthCalledWith(
        calls++,
        new GetDeviceByIndexCommand(category, 1),
        expect.any(String),
      );
    }
  });

  describe('handleContactId', () => {
    let operationModeSpy: jest.SpyInstance;
    let stateValueSpy: jest.SpyInstance;
    let onEventSpy: jest.SpyInstance;

    beforeEach(() => {
      operationModeSpy = jest.spyOn(BaseUnit.prototype, 'operationMode', 'set');
      stateValueSpy = jest.spyOn(BaseUnit.prototype, 'state', 'set');
      baseUnit.onEvent = jest.fn();
      onEventSpy = jest.spyOn(baseUnit, 'onEvent');
    });

    test('does nothing', () => {
      const contactId = new ContactIdBuilder().build();
      baseUnit['handleContactId'](contactId);

      expect(operationModeSpy).not.toHaveBeenCalled();
      expect(stateValueSpy).not.toHaveBeenCalled();
      expect(onEventSpy).not.toHaveBeenCalled();
    });

    test('when event code is Away_QuickArm', () => {
      const contactId = new ContactIdBuilder()
        .eventCode(ContactIDEventCode.Away_QuickArm)
        .build();
      baseUnit['handleContactId'](contactId);

      expect(operationModeSpy).toHaveBeenNthCalledWith(1, new IntEnum(OperationMode, OperationMode.Away));
      expect(stateValueSpy).toHaveBeenNthCalledWith(1, BaseUnitState.Away);
    });

    test('when event code is Away and qualifier is Restore', () => {
      const contactId = new ContactIdBuilder()
        .eventCode(ContactIDEventCode.Away)
        .eventQualifier(ContactIDEventQualifier.Restore)
        .build();
      baseUnit['handleContactId'](contactId);

      expect(operationModeSpy).toHaveBeenNthCalledWith(1, new IntEnum(OperationMode, OperationMode.Away));
      expect(stateValueSpy).toHaveBeenNthCalledWith(1, BaseUnitState.Away);
    });

    test('when event code is Home', () => {
      const contactId = new ContactIdBuilder()
        .eventCode(ContactIDEventCode.Home)
        .build();
      baseUnit['handleContactId'](contactId);

      expect(operationModeSpy).toHaveBeenNthCalledWith(1, new IntEnum(OperationMode, OperationMode.Home));
      expect(stateValueSpy).toHaveBeenNthCalledWith(1, BaseUnitState.Home);
    });

    test('when event code is Disarm', () => {
      const contactId = new ContactIdBuilder()
        .eventCode(ContactIDEventCode.Disarm)
        .build();
      baseUnit['handleContactId'](contactId);

      expect(operationModeSpy).toHaveBeenNthCalledWith(1, new IntEnum(OperationMode, OperationMode.Disarm));
      expect(stateValueSpy).toHaveBeenNthCalledWith(1, BaseUnitState.Disarm);
    });

    test('when event code is Away and qualifier is Event', () => {
      const contactId = new ContactIdBuilder()
        .eventCode(ContactIDEventCode.Away)
        .eventQualifier(ContactIDEventQualifier.Event)
        .build();
      baseUnit['handleContactId'](contactId);

      expect(operationModeSpy).toHaveBeenNthCalledWith(1, new IntEnum(OperationMode, OperationMode.Disarm));
      expect(stateValueSpy).toHaveBeenNthCalledWith(1, BaseUnitState.Disarm);
    });

    test('when event code is MonitorMode', () => {
      const contactId = new ContactIdBuilder()
        .eventCode(ContactIDEventCode.MonitorMode)
        .build();
      baseUnit['handleContactId'](contactId);

      expect(operationModeSpy).toHaveBeenNthCalledWith(1, new IntEnum(OperationMode, OperationMode.Monitor));
      expect(stateValueSpy).toHaveBeenNthCalledWith(1, BaseUnitState.Monitor);
    });

    test('when event code is Alarm and qualifier is Event and stateValue is AwayEntryDelay', () => {
      baseUnit['state'] = BaseUnitState.AwayEntryDelay;
      stateValueSpy.mockClear();
      const contactId = new ContactIdBuilder()
        .eventCode(ContactIDEventCode.BurglarAlarm & 0xf00)
        .eventQualifier(ContactIDEventQualifier.Event)
        .build();

      baseUnit['handleContactId'](contactId);

      expect(stateValueSpy).toHaveBeenNthCalledWith(1, BaseUnitState.Away);
    });

    describe('onEvent', () => {
      test('Calls onEvent', () => {
        const contactId = new ContactIdBuilder()
          .eventCode(ContactIDEventCode.Away)
          .build();
        baseUnit['handleContactId'](contactId);

        expect(onEventSpy).toHaveBeenNthCalledWith(1, contactId);
      });

      test('Catches errors from onEvent', () => {
        onEventSpy.mockImplementation(() => {
          throw new Error();
        });

        const contactId = new ContactIdBuilder()
          .eventCode(ContactIDEventCode.Away)
          .build();
        baseUnit['handleContactId'](contactId);

        expect(log4js.getLogger().error).toHaveBeenCalledWith('Unhandled exception in onEvent callback');
      });
    });
  });

  describe('handleDeviceEvent', () => {
    let device: Device;

    beforeEach(() => {
      baseUnit.onEvent = jest.fn();
    });

    test('dont call device.handleDeviceEvent if device is missing from the device list', () => {
      baseUnit['handleDeviceEvent'](new DeviceEvent('MINPIC=0000000000000000000000'));

      expect(log4js.getLogger().warn).toHaveBeenCalledWith('Event for device not in our collection: Id: 000000');
    });

    describe('Away and AwayExitDelay', () => {
      let dir: DeviceInfoResponse;
      beforeEach(() => {
        dir = new DeviceInfoResponseBuilder()
          .deviceCategory(DC_CONTROLLER)
          .deviceId('f01a7a')
          .enableStatus(ESFlags.Delay)
          .build();
      });

      test('set stateValue to AwayExitDelay', () => {
        device = new Device(dir);
        device.handleDeviceEvent = jest.fn();
        baseUnit.devices.set(device.deviceId, device);
        const deviceEvent = new DeviceEvent('MINPIC=0a1000f01a7a');
        baseUnit['_exitDelay'] = 10;

        baseUnit['handleDeviceEvent'](deviceEvent);

        expect(baseUnit.state).toEqual(BaseUnitState.AwayExitDelay);
      });

      test('set stateValue and operationMode to Away', () => {
        device = new Device(dir);
        device.handleDeviceEvent = jest.fn();
        baseUnit.devices.set(device.deviceId, device);
        const deviceEvent = new DeviceEvent('MINPIC=0a1000f01a7a');

        baseUnit['handleDeviceEvent'](deviceEvent);

        expect(baseUnit.operationMode).toEqual(new IntEnum(OperationMode, OperationMode.Away));
        expect(baseUnit.state).toEqual(BaseUnitState.Away);
      });
    });

    test('set stateValue and operationMode to Home', () => {
      const dir = new DeviceInfoResponseBuilder()
        .deviceId('f01a7a')
        .build();
      device = new Device(dir);
      device.handleDeviceEvent = jest.fn();
      baseUnit.devices.set(device.deviceId, device);
      const deviceEvent = new DeviceEvent('MINPIC=0a1800f01a7a');

      baseUnit['handleDeviceEvent'](deviceEvent);

      expect(baseUnit.operationMode).toEqual(new IntEnum(OperationMode, OperationMode.Home));
      expect(baseUnit.state).toEqual(BaseUnitState.Home);
    });

    test('set stateValue and operationMode to Disarm', () => {
      const dir = new DeviceInfoResponseBuilder()
        .deviceId('f01a7a')
        .build();
      device = new Device(dir);
      device.handleDeviceEvent = jest.fn();
      baseUnit.devices.set(device.deviceId, device);
      const deviceEvent = new DeviceEvent('MINPIC=0a1400f01a7a');

      baseUnit['handleDeviceEvent'](deviceEvent);

      expect(baseUnit.operationMode).toEqual(new IntEnum(OperationMode, OperationMode.Disarm));
      expect(baseUnit.state).toEqual(BaseUnitState.Disarm);
    });

    test('set stateValue to AwayEntryDelay', () => {
      const dir = new DeviceInfoResponseBuilder()
        .deviceId('f01a7a')
        .enableStatus(ESFlags.Delay)
        .build();
      device = new Device(dir);
      device.handleDeviceEvent = jest.fn();
      baseUnit.devices.set(device.deviceId, device);
      const deviceEvent = new DeviceEvent('MINPIC=0a5800f01a7a');
      baseUnit['_operationMode'] = new IntEnum(OperationMode, OperationMode.Away);
      baseUnit['_entryDelay'] = 10;

      baseUnit['handleDeviceEvent'](deviceEvent);

      expect(baseUnit.state).toEqual(BaseUnitState.AwayEntryDelay);
    });
  });

  describe('handleResponse', () => {
    test('handles ROMVersionResponse', () => {
      baseUnit['handleResponse'](new ROMVersionResponse('vn1foo2bar'));
      expect(baseUnit['ROMVersion']).toBe('1foo2bar');
    });

    test('handles OpModeResponse', () => {
      baseUnit['handleResponse'](new OpModeResponse('n0s0'));
      expect(baseUnit['operationMode']).toEqual(new IntEnum(OperationMode, OperationMode.Disarm));
      expect(baseUnit['state']).toBe(0);
    });

    test('handles ExitDelayResponse', () => {
      baseUnit['handleResponse'](new ExitDelayResponse('l0s05'));
      expect(baseUnit['exitDelay']).toBe(5);
    });

    test('handles EntryDelayResponse', () => {
      baseUnit['handleResponse'](new EntryDelayResponse('l1s06'));
      expect(baseUnit['entryDelay']).toBe(6);
    });

    describe('handles DateTimeResponse', () => {
      test('get', () => {
        baseUnit['handleResponse'](new DateTimeResponse('dt86042071200'));
        expect(log4js.getLogger().info).toHaveBeenCalledWith('Remote date/time is 1986-04-20T12:00:00.000');
      });

      test('set', () => {
        baseUnit['handleResponse'](new DateTimeResponse('dts86042071200'));
        expect(log4js.getLogger().info).toHaveBeenCalledWith('Remote date/time was set to 1986-04-20T12:00:00.000');
      });
    });

    describe('handles DeviceInfoResponse', () => {
      describe('when device does not exists in device list', () => {
        let response: DeviceInfoResponse;
        let onDeviceAddedSpy: jest.SpyInstance;

        beforeEach(() => {
          baseUnit.onDeviceAdded = jest.fn();
          onDeviceAddedSpy = jest.spyOn(baseUnit, 'onDeviceAdded');
          response = new DeviceInfoResponse('ib0050f01a7a0010e41102141000005b05');
        });

        test('sets new device to device list', () => {
          baseUnit['handleResponse'](response);
          expect(baseUnit['devices'].get(15735418)).toEqual(expect.any(Device));
        });

        test('calls onDeviceAdded', () => {
          baseUnit['handleResponse'](response);
          expect(baseUnit['devices'].get(15735418)).toEqual(expect.any(Device));

          expect(onDeviceAddedSpy).toHaveBeenNthCalledWith(1, expect.any(Device));
        });

        test('Catches errors from onPropertiesChanged', () => {
          onDeviceAddedSpy.mockImplementation(() => {
            throw new Error();
          });

          baseUnit['handleResponse'](response);

          expect(log4js.getLogger().error).toHaveBeenCalledWith('Unhandled exception in onDeviceAdded callback');
        });
      });

      test('calls devices handleResponse when device exists in device list', () => {
        const response = new DeviceInfoResponseBuilder()
          .deviceId('f01a7a')
          .build();

        const device = new Device(response);
        baseUnit.devices.set(device.deviceId, device);
        const deviceHandleResponseSpy = jest.spyOn(device, 'handleResponse');

        baseUnit['handleResponse'](response);
        expect(baseUnit['devices'].get(device.deviceId)).toEqual(device);

        expect(deviceHandleResponseSpy).toHaveBeenNthCalledWith(1, response);
      });
    });

    test('handles DeviceAddedResponse', () => {
      const response = new DeviceAddedResponse('ibl0511021410');
      baseUnit['executeRetry'] = jest.fn();

      baseUnit['handleResponse'](response);

      expect(baseUnit['executeRetry']).toHaveBeenNthCalledWith(
        1,
        new GetDeviceByIndexCommand(response.deviceCategory, response.index),
        expect.any(String),
      );
    });
  });

  describe('executeRetry', () => {
    let command: Command;

    beforeEach(() => {
      command = new ClearStatusCommand();
      baseUnit['isConnected'] = true;
    });

    test('dont call execute when isConnected is false', async () => {
      baseUnit['isConnected'] = false;

      await baseUnit['executeRetry'](command, 'FooBar');
      expect(executeSpy).not.toHaveBeenCalled();
    });

    test('Tries 5 times when maxRetries 5 is given', async () => {
      executeSpy.mockRejectedValue('');

      await baseUnit['executeRetry'](command, 'FooBar', 5);
      expect(executeSpy).toHaveBeenCalledWith(command);
      expect(executeSpy).toHaveBeenCalledTimes(5);
    });

    test('returns response when execute succeeds', async () => {
      executeSpy.mockRejectedValueOnce('').mockRejectedValueOnce('').mockResolvedValueOnce(new ClearedStatusResponse());

      const response = await baseUnit['executeRetry'](command, 'FooBar');
      expect(executeSpy).toHaveBeenCalledWith(command);
      expect(executeSpy).toHaveBeenCalledTimes(3);
      expect(response).toEqual(new ClearedStatusResponse());
    });

    test('logs errors when execute are failing', async () => {
      executeSpy.mockRejectedValue('');

      await baseUnit['executeRetry'](command, 'FooBar');
      expect(log4js.getLogger().error).toHaveBeenCalledTimes(3);
    });
  });

  describe('notifyChange', () => {
    let onPropertiesChangedSpy: jest.SpyInstance;

    beforeEach(() => {
      baseUnit.onPropertiesChanged = jest.fn();
      onPropertiesChangedSpy = jest.spyOn(baseUnit, 'onPropertiesChanged');
    });

    test('does nothing', () => {
      baseUnit['notifyChange'](new PropertyChangedInfo('foo', true, true));
      expect(baseUnit.onPropertiesChanged).not.toHaveBeenCalled();
    });

    test('Calls onPropertiesChanged', () => {
      const changedProp = new PropertyChangedInfo('foo', true, false);
      baseUnit['notifyChange'](changedProp);

      expect(onPropertiesChangedSpy).toHaveBeenNthCalledWith(1, changedProp);
    });

    test('Catches errors from onPropertiesChanged', () => {
      onPropertiesChangedSpy.mockImplementation(() => {
        throw new Error();
      });

      baseUnit['notifyChange'](new PropertyChangedInfo('foo', true, false));

      expect(log4js.getLogger().error).toHaveBeenCalledWith('Unhandled exception in onPropertiesChanged callback');
    });
  });
});
