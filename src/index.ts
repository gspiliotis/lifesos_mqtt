#! /usr/bin/env node
import { Command } from 'commander';
import figlet from 'figlet';
import fs from 'fs';
import yaml from 'js-yaml';
import { getLogger } from 'log4js';
import { Client, DC_ALL, DeviceInfoResponse, DeviceNotFoundResponse, GetDeviceByIndexCommand } from 'nodesos';
import { sprintf } from 'sprintf-js';
import { configureLog4j } from './Logger';
import { description, version } from './meta';
import NodeSOSMqttAdapter from './NodeSOSMqttAdapter';

const NAME = 'nodesos_mqtt';
const VERSION = version;
const DESCRIPTION = description;
const DEFAULT_CONFIGFILE = 'config.yaml';

configureLog4j('info');
const logger = getLogger('NodeSOSMQTT');

const program = new Command();

export type DeviceInfo = {
  name: string;
  manufacturer?: string;
  model?: string;
};

export type BaseUnitConfig = DeviceInfo & {
  topic: string;
};

export type DeviceConfig = DeviceInfo & {
  id: string;
  topic: string;
};

export type Config = {
  lifesos: {
    host?: string;
    port: number;
    password?: string;
  };
  mqtt: {
    uri: string;
    client_id: string;
  };
  adapter: {
    discovery_prefix: string;
    birth_topic: string;
    birth_payload: string;
    baseunit: BaseUnitConfig;
    devices: DeviceConfig[];
  };
};

type ActionOptions = {
  verbose?: boolean;
  configfile: string;
};

const getConfig = (path: string) => {
  if (fs.existsSync(path)) {
    logger.debug(`Loading configuration file '${path}'`);
  } else {
    throw new Error(`No configuration file found at '${path}'`);
  }

  return yaml.load(fs.readFileSync(path, 'utf8')) as Config;
};

const listDevices = async (options: ActionOptions) => {
  if (options.verbose) {
    configureLog4j('debug');
  }

  const config = getConfig(options.configfile);

  const client = new Client(config.lifesos.port, config.lifesos.host);

  if (config.lifesos.password) {
    client.password = config.lifesos.password;
  }

  await client.open();

  // @TODO: Handle connection errors.

  logger.info('Listing devices....');
  let count = 0;

  for (const category of DC_ALL) {
    if (!category.maxDevices) {
      continue;
    }

    for (let index = 0; index < category.maxDevices; index++) {
      logger.debug(`Getting ${category.description} device #${index}`);
      const response = await client.execute<DeviceInfoResponse>(
        new GetDeviceByIndexCommand(category, index),
        `Failed to get ${category.description} device #${index}`,
      );

      if (!response || response instanceof DeviceNotFoundResponse) {
        break;
      }

      count++;

      logger.info(
        sprintf(
          'DeviceID "%s" for %s zone %s, a %s.',
          response.deviceId,
          response.deviceCategory.description,
          response.zone,
          response.deviceType.string,
        ),
      );
    }
  }

  logger.info(`${count} devices were found.`);

  client.close();
};

const start = (options: ActionOptions) => {
  if (options.verbose) {
    configureLog4j('debug');
  }

  const gracefulShutdown = async () => {
    logger.info('Shutting down....');
    await adapter.stop();
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  const config = getConfig(options.configfile);

  const adapter = new NodeSOSMqttAdapter(config);
  adapter.start().catch((error) => {
    logger.error('Could not connect to the base unit', error);
    gracefulShutdown();
  });
};

// Display application header
console.log(figlet.textSync('NodeSOS MQTT')); // eslint-disable-line no-console
console.log(`NodeSOS_MQTT ${VERSION} - ${DESCRIPTION}.\n\n`); // eslint-disable-line no-console

program.name(NAME).description(DESCRIPTION).version(VERSION);

program
  .command('list-devices')
  .description('list devices enrolled on base unit')
  .option('-v, --verbose', 'display all logging output')
  .option('-c, --configfile <configfile>', 'configuration file name', DEFAULT_CONFIGFILE)
  .action(listDevices);

program
  .command('start')
  .description('start a client')
  .option('-v, --verbose', 'display all logging output')
  .option('-c, --configfile <configfile>', 'configuration file name', DEFAULT_CONFIGFILE)
  .action(start);

program.parse();
