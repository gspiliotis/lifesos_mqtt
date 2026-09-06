import DeviceSettingsResponse from './DeviceSettingsResponse';

/**
 * Response that indicates device settings were changed.
 */
class DeviceChangedResponse extends DeviceSettingsResponse {
  constructor(text: string) {
    super(text);
  }
}

export default DeviceChangedResponse;
