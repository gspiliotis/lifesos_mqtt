import { sprintf } from 'sprintf-js';
import { CMD_DEVICE_PREFIX } from '../src/Const';
import ContactId from '../src/ContactId';
import DeviceCategory from '../src/DeviceCategory';
import { MessageType } from '../src/Enums';
import DeviceInfoResponse from '../src/Responses/DeviceInfoResponse';

/**
 * Test util builders to help with mocking objects.
 */

export class ContactIdBuilder {
  private _accountNumber = 0;
  private _deviceCategory = 0;
  private _eventCode = 0;
  private _eventQualifier = 0;
  private _groupNumber = 0;
  private _messageType= MessageType.Optional as number;
  private _unitNumber = 0;

  accountNumber(value: number) {
    this._accountNumber = value;
    return this;
  }

  deviceCategory(deviceCategory: DeviceCategory) {
    this._deviceCategory = deviceCategory.number;
    return this;
  }

  eventCode(value: number) {
    this._eventCode = value;
    return this;
  }

  eventQualifier(value: number) {
    this._eventQualifier = value;
    return this;
  }

  groupNumber(value: number) {
    this._groupNumber = value;
    return this;
  }

  messageType(value: number | MessageType) {
    this._messageType = value;
    return this;
  }

  unitNumber(value: number) {
    this._unitNumber = value;
    return this;
  }

  build() {
    const response = this.addChecksum(sprintf(
      '%s%s%s%s%s%s%s%s',
      this._accountNumber.toString(16).padStart(4, '0'),
      this._messageType.toString(16).padStart(2, '0'),
      this._eventQualifier.toString(16),
      this._eventCode.toString(16).padStart(3, '0'),
      this._groupNumber.toString(16).padStart(2, '0'),
      this._deviceCategory.toString(16),
      this._unitNumber.toString(16).padStart(2, '0'),
      0x0.toString(16),
    ));

    return new ContactId(response);
  }

  private addChecksum(text: string) {
    const ZERO_DIGIT_VALUE = 0;
    const MODULO_VALUE = 15;
    const MAX_DIGIT = 10;

    const response = text.slice(0, -1);

    let value = 0;
    for (const hexChar of response) {
      const digit = parseInt(hexChar, 16);
      value += digit !== ZERO_DIGIT_VALUE ? digit : MAX_DIGIT;
    }

    if (value % MODULO_VALUE === 0) {
      return `${response}0`;
    }

    let difference = 0;
    let runs = 0;
    while ((value + difference) % MODULO_VALUE !== 0) {
      if (runs === MODULO_VALUE + 1) {
        throw new Error('No modulo found. Something is wrong with the input.');
      }
      difference++;
      runs++;
    }

    return `${response}${difference.toString(16)}`;
  }
}

export class DeviceInfoResponseBuilder {
  private _commandName: string = 'i';
  private _currentStatus: number = 0;
  private _deviceCategory: string = 'b';
  private _deviceCharacteristics: number = 0;
  private _deviceId: string = '';
  private _deviceType: number = 0;
  private _downCount: number = 0;
  private _enableStatus: number = 0;
  private _groupNumber: number = 0;
  private _index: number = 0;
  private _messageAttribute: number = 0;
  private _unitNumber: number = 0;

  commandName(value: string) {
    this._commandName = value;
    return this;
  }

  currentStatus(value: number) {
    this._currentStatus = value;
    return this;
  }

  deviceCategory(deviceCategory: DeviceCategory) {
    this._deviceCategory = deviceCategory.code;
    return this;
  }

  deviceCharacteristics(value: number) {
    this._deviceCharacteristics = value;
    return this;
  }

  deviceId(value: string) {
    this._deviceId = value;
    return this;
  }

  deviceType(value: number) {
    this._deviceType = value;
    return this;
  }

  downCount(value: number) {
    this._downCount = value;
    return this;
  }

  enableStatus(value: number) {
    this._enableStatus = value;
    return this;
  }

  groupNumber(value: number) {
    this._groupNumber = value;
    return this;
  }

  index(value: number) {
    this._index = value;
    return this;
  }

  messageAttribute(value: number) {
    this._messageAttribute = value;
    return this;
  }

  unitNumber(value: number) {
    this._unitNumber = value;
    return this;
  }

  build() {
    const response = sprintf(
      '%s%s%s%s%s%s%s%s%s%s%s%s%s%s',
      this._commandName,
      this._deviceCategory,
      this._commandName === CMD_DEVICE_PREFIX ? this._index.toString(16).padStart(2, '0') : '',
      this._deviceType.toString(16).padStart(2, '0'),
      this._deviceId.padStart(6, '0'),
      this._messageAttribute.toString(16).padStart(2, '0'),
      this._deviceCharacteristics.toString(16).padStart(2, '0'),
      0x0.toString(16).padStart(2, '0'),
      this._groupNumber.toString(16).padStart(2, '0'),
      this._unitNumber.toString(16).padStart(2, '0'),
      this._enableStatus.toString(16).padStart(4, '0'),
      0x0.toString(16).padStart(4, '0'),
      this._currentStatus.toString(16).padStart(2, '0'),
      this._downCount.toString(16).padStart(2, '0'),
    );

    return new DeviceInfoResponse(response);
  }
}
