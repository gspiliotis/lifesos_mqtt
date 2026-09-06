import { DateTime } from 'luxon';
import { sprintf } from 'sprintf-js';
import { CMD_EVENT_LOG } from '../Const';
import DeviceCategory, { DC_ALL, DC_BASEUNIT } from '../DeviceCategory';
import { ContactIDEventCode, ContactIDEventQualifier, IntEnum } from '../Enums';
import Response from '../Response';
import { fromAsciiHex } from '../Utils';

/**
 * Response that provides an entry from the event log.
 */
class EventLogResponse extends Response {
  /**
   * Category of device that originated the event.
   *
   * From what I can tell, this is the same as device_category except
   * when changing operation mode via keypad or ethernet interface. In this
   * one case, deviceCategory=='baseunit' and action=='controller'.
   */
  readonly action: DeviceCategory;

  /**
   * @inheritDoc
   */
  readonly commandName = CMD_EVENT_LOG;

  /**
   * Date and time the event was logged (year and seconds are omitted)
   */
  readonly dateTime?: string;

  /**
   * Category for the device.
   */
  readonly deviceCategory: DeviceCategory;

  /**
   * Type of event.
   */
  readonly eventCode: IntEnum<typeof ContactIDEventCode>;

  /**
   * Provides context for the type of event..
   */
  readonly eventQualifier: IntEnum<typeof ContactIDEventQualifier>;

  /**
   * Group number the device is assigned to.
   */
  readonly groupNumber?: number;

  /**
   * Index for the last entry in the event log.
   */
  readonly lastIndex: number;

  /**
   * Identifies the user.
   */
  readonly userId?: number;

  /**
   * Unit number the device is assigned to (within group).
   */
  readonly unitNumber?: number;

  constructor(text: string) {
    super();
    text = text.slice(CMD_EVENT_LOG.length);
    this.eventQualifier = new IntEnum(ContactIDEventQualifier, fromAsciiHex(text.slice(0, 1)));
    this.eventCode = new IntEnum(ContactIDEventCode, fromAsciiHex(text.slice(1, 4)));
    const groupPartition = fromAsciiHex(text.slice(4, 6));
    this.deviceCategory = DC_ALL[fromAsciiHex(text.slice(7, 8))];
    const zoneUser = fromAsciiHex(text.slice(8, 10));

    if (this.deviceCategory === DC_BASEUNIT) {
      this.userId = zoneUser !== 0 ? zoneUser : undefined;
    } else {
      this.groupNumber = groupPartition;
      this.unitNumber = zoneUser;
    }
    this.action = DC_ALL[fromAsciiHex(text.slice(10, 12))];
    this.dateTime =
      DateTime.fromFormat(text.slice(12, 20), 'LLddHHmm').toISO({
        includeOffset: false,
      }) ?? undefined;
    this.lastIndex = fromAsciiHex(text.slice(20, 23));
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

export default EventLogResponse;
