import DeviceSettingsResponse from './DeviceSettingsResponse';

/**
 * Response that indicates a new device was successfully enrolled.
 */
class DeviceAddedResponse extends DeviceSettingsResponse {
  constructor(text: string) {
    super(text);
  }
}

export default DeviceAddedResponse;
