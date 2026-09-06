// Command names
export const CMD_CLEAR_STATUS = 'l5';
export const CMD_DATETIME = 'dt';
export const CMD_DEVBYIDX_PREFIX = 'k';
export const CMD_DEVICE_PREFIX = 'i';
export const CMD_ENTRY_DELAY = 'l1';
export const CMD_EVENT_LOG = 'ev';
export const CMD_EXIT_DELAY = 'l0';
export const CMD_OPMODE = 'n0';
export const CMD_ROMVER = 'vn';
export const CMD_SENSOR_LOG = 'et';

// Actions that can be performed by a command
export const ACTION_NONE = '';
export const ACTION_GET = '?';
export const ACTION_SET = 's';
export const ACTION_ADD = 'l';
export const ACTION_DEL = 'k';

// Markers used at the start and end of commands/responses
export const MARKER_START = '!';
export const MARKER_END = '&';

// Text appended to response when base unit reports error
export const RESPONSE_ERROR = 'no';
