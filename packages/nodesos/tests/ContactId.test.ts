import { ContactIdBuilder } from './Builders';
import ContactId from '../src/ContactId';
import { DC_BASEUNIT, DC_BURGLAR } from '../src/DeviceCategory';
import { ContactIDEventCategory, ContactIDEventCode, ContactIDEventQualifier, IntEnum } from '../src/Enums';

describe('ContactID', () => {

  describe('constructor', () => {
    test('with BaseUnit PeriodicTestReport', () => {
      const contactId = new ContactId('0539181602005005');
      expect(contactId.accountNumber).toBe(1337);
      expect(contactId.checksum).toBe(5);
      expect(contactId.deviceCategory).toEqual(DC_BASEUNIT);
      expect(contactId.eventCategory).toEqual(new IntEnum(ContactIDEventCategory, ContactIDEventCategory.Test_Misc));
      expect(contactId.eventCode).toEqual(new IntEnum(ContactIDEventCode, ContactIDEventCode.PeriodicTestReport));
      expect(contactId.eventQualifier).toEqual(new IntEnum(ContactIDEventQualifier, ContactIDEventQualifier.Event));
      expect(contactId.groupNumber).toBeUndefined();
      expect(contactId.messageType).toBe(24);
      expect(contactId.unitNumber).toBeUndefined();
      expect(contactId.userId).toBeUndefined();
    });

    test('with Burglar RFLowBattery', () => {
      const contactId = new ContactId('053918138403110d');
      expect(contactId.accountNumber).toBe(1337);
      expect(contactId.checksum).toBe(13);
      expect(contactId.deviceCategory).toEqual(DC_BURGLAR);
      expect(contactId.eventCategory).toEqual(new IntEnum(ContactIDEventCategory, ContactIDEventCategory.Trouble));
      expect(contactId.eventCode).toEqual(new IntEnum(ContactIDEventCode, ContactIDEventCode.RFLowBattery));
      expect(contactId.eventQualifier).toEqual(new IntEnum(ContactIDEventQualifier, ContactIDEventQualifier.Event));
      expect(contactId.groupNumber).toBe(3);
      expect(contactId.messageType).toBe(24);
      expect(contactId.unitNumber).toBe(16);
      expect(contactId.userId).toBeUndefined();
    });

    test('with zone user', () => {
      const contactId = new ContactIdBuilder()
        .deviceCategory(DC_BASEUNIT)
        .unitNumber(5)
        .build();
      expect(contactId.userId).toBe(5);
    });

    test('fails when given text is not 16 chars long', () => {
      expect(() => new ContactId('123456')).toThrow('ContactID message length is invalid.');
    });

    test('fails when checksum can not be verified.', () => {
      expect(() => new ContactId('1234567890abcdef')).toThrow('ContactID message checksum failure.');
    });

    test('fails when the message type is invalid', () => {
      expect(() => new ContactId('0539171602005006')).toThrow('ContactID message type (23) is invalid.');
    });
  });

  describe('zone', () => {
    test('Baseunit', () => {
      const response = new ContactIdBuilder()
        .deviceCategory(DC_BASEUNIT)
        .build();
      expect(response.zone).toBeUndefined();
    });
    test('Not baseunit', () => {
      const response = new ContactIdBuilder()
        .deviceCategory(DC_BURGLAR)
        .groupNumber(3)
        .unitNumber(16)
        .build();
      expect(response.zone).toBe('03-10');
    });
  });
});
