import { BaseUnitConfig, DeviceConfig } from './index';

export const deviceInfo = (identifier: string, config: BaseUnitConfig | DeviceConfig) => {
  return {
    device: {
      identifiers: identifier,
      name: config.name,
      manufacturer: config.manufacturer,
      model: config.model,
    },
  };
};

export const availabilityInfo = (topic: string) => {
  return {
    availability_topic: `${topic}/is_connected`,
    payload_available: String(true),
    payload_not_available: String(false),
  };
};
