import { DeviceInfoResponseBuilder } from './Builders';
import { DC_BURGLAR } from '../src/DeviceCategory';
import { DeviceType } from '../src/Enums';
import DeviceInfoResponse from '../src/Responses/DeviceInfoResponse';

describe('DeviceInfoResponseBuilder', () => {
  test('with index', () => {
    const mocked = new DeviceInfoResponseBuilder()
      .commandName('i')
      .deviceCategory(DC_BURGLAR)
      .index(0)
      .deviceType(DeviceType.PIRSensor)
      .deviceId('f01a7a')
      .messageAttribute(0)
      .deviceCharacteristics(16)
      .groupNumber(17)
      .unitNumber(2)
      .enableStatus(5136)
      .currentStatus(91)
      .downCount(5)
      .build();

    expect(mocked).toEqual(new DeviceInfoResponse('ib0050f01a7a0010001102141000005b05'))
  });

  test('without index', () => {
    const mocked = new DeviceInfoResponseBuilder()
      .commandName('k')
      .deviceCategory(DC_BURGLAR)
      .index(0)
      .deviceType(DeviceType.PIRSensor)
      .deviceId('f01a7a')
      .messageAttribute(0)
      .deviceCharacteristics(16)
      .groupNumber(17)
      .unitNumber(2)
      .enableStatus(5136)
      .currentStatus(91)
      .downCount(5)
      .build();

    expect(mocked).toEqual(new DeviceInfoResponse('kb50f01a7a0010001102141000005b05'))
  });
});
