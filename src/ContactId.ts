import { sprintf } from 'sprintf-js';
import DeviceCategory, { DC_ALL, DC_BASEUNIT } from './DeviceCategory';
import { ContactIDEventCategory, ContactIDEventCode, ContactIDEventQualifier, IntEnum, MessageType } from './Enums';

/**
 * Represents a message using the Ademco ® Contact ID protocol.
 */
class ContactId {
  /**
   * Account number identifies this alarm panel to the receiver.
   */
  readonly accountNumber: number;

  /**
   * Checksum digit used to verify message integrity.
   */
  readonly checksum: number;

  /**
   * Category for the device.
   */
  readonly deviceCategory?: DeviceCategory;

  /**
   * Category for the type of event.
   */
  readonly eventCategory: IntEnum<typeof ContactIDEventCategory>;

  /**
   * Type of event.
   */
  readonly eventCode: IntEnum<typeof ContactIDEventCode>;

  /**
   * Provides context for the type of event.
   */
  readonly eventQualifier: IntEnum<typeof ContactIDEventQualifier>;

  /**
   * Group number the device is assigned to.
   */
  readonly groupNumber?: number;

  /**
   * Message type is used to identify the message to the receiver.
   *
   * It must be 18 (preferred) or 98 (optional).
   */
  readonly messageType: number;

  /**
   * Unit number the device is assigned to (within group).
   */
  readonly unitNumber?: number;

  /**
   * Identifies the user.
   */
  readonly userId?: number;

  constructor(text: string) {
    if (text.length !== 16) {
      throw new Error('ContactID message length is invalid.');
    }

    // Verify checksum
    let checkVal = 0;
    for (const hexChar of text) {
      const checkDigit = parseInt(hexChar, 16);
      checkVal += checkDigit !== 0 ? checkDigit : 10;
    }

    if (checkVal % 15 !== 0) {
      throw new Error('ContactID message checksum failure.');
    }

    this.accountNumber = parseInt(text.slice(0, 4), 16);
    this.messageType = parseInt(text.slice(4, 6), 16);

    if (![MessageType.Preferred as number, MessageType.Optional as number].includes(this.messageType)) {
      throw new Error(`ContactID message type (${this.messageType}) is invalid.`);
    }

    this.eventQualifier = new IntEnum(ContactIDEventQualifier, parseInt(text.slice(6, 7), 16));
    this.eventCode = new IntEnum(ContactIDEventCode, parseInt(text.slice(7, 10), 16));
    const groupPartition = parseInt(text.slice(10, 12), 16);

    // Spec says zone/user uses next 3 digits; however LifeSOS uses the
    // first digit for device category index, and the remaining two digits
    // for either unit number or user id (depending on whether event is
    // for the base unit or not)
    this.deviceCategory = DC_ALL[parseInt(text.slice(12, 13), 16)];
    const zoneUser = parseInt(text.slice(13, 15), 16);

    this.eventCategory = new IntEnum(ContactIDEventCategory, this.eventCode.value & 0xf00);

    if (this.deviceCategory === DC_BASEUNIT) {
      this.userId = zoneUser !== 0 ? zoneUser : undefined;
    } else {
      this.groupNumber = groupPartition;
      this.unitNumber = zoneUser;
    }

    this.checksum = parseInt(text.slice(15, 16), 16);
  }

  /**
   * Zone the device is assigned to.
   */
  get zone() {
    if (this.deviceCategory === DC_BASEUNIT) {
      return undefined;
    }
    return sprintf('%02x-%02x', this.groupNumber, this.unitNumber);
  }
}

export default ContactId;
