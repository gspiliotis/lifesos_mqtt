/**
 * Dump the LifeSOS base unit's internal Contact ID event log.
 *
 * The panel keeps its own event log in Contact ID format, queryable by index,
 * independently of whatever it does or does not broadcast on the socket. Each
 * entry carries an event code (e.g. RFLowBattery = 900) and a qualifier
 * (Event = 1, Restore = 3, Repeat = 6), so a battery restore is visible here
 * even when no PowerOnReset device event is ever transmitted.
 *
 * Usage:
 *   npx tsc && node dist/dump-event-log.js -c /path/to/config.yaml
 *   node dist/dump-event-log.js -c config.yaml --code 900
 *   node dist/dump-event-log.js -c config.yaml --json > eventlog.json
 *
 * Caveat: logged timestamps use the format 'LLddHHmm' — no year, no seconds.
 * Entries more than a year old are ambiguous and the year shown is inferred by
 * luxon, not read from the panel. Treat month/day/time as authoritative and the
 * year as a guess.
 */

import { Command } from 'commander';
import { Client, EventLogResponse, GetEventLogCommand } from 'nodesos';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { getLogger } from 'log4js';
import { configureLog4j } from './Logger';
import type { Config } from './index';

const logger = getLogger('NodeSOSMQTT');

type Options = {
  configfile: string;
  verbose?: boolean;
  json?: boolean;
  code?: string;
  max?: string;
};

type Entry = {
  index: number;
  dateTime?: string;
  qualifier: string;
  qualifierValue: number;
  eventCode: string;
  eventCodeValue: number;
  deviceCategory: string;
  action: string;
  zone?: string;
  userId?: number;
};

const isEventLogResponse = (response: unknown): response is EventLogResponse =>
  typeof response === 'object' && response !== null && 'eventCode' in response;

const dumpEventLog = async (options: Options) => {
  configureLog4j(options.verbose ? 'debug' : options.json ? 'error' : 'info');

  if (!fs.existsSync(options.configfile)) {
    throw new Error(`No configuration file found at '${options.configfile}'`);
  }
  const config = yaml.load(fs.readFileSync(options.configfile, 'utf8')) as Config;

  const client = new Client(config.lifesos.port, config.lifesos.host);
  if (config.lifesos.password) {
    client.password = config.lifesos.password;
  }

  await client.open();

  try {
    // Every response carries lastIndex, so entry 0 tells us how far to walk.
    const first = await client.execute<EventLogResponse>(new GetEventLogCommand(0));
    if (!isEventLogResponse(first)) {
      logger.warn('Event log is empty, or the base unit refused index 0.');
      return;
    }

    const hardMax = options.max ? parseInt(options.max, 10) : Infinity;
    const lastIndex = Math.min(first.lastIndex, hardMax);
    logger.info(`Event log reports lastIndex=${first.lastIndex}; reading 0..${lastIndex}`);

    const filterCode = options.code ? parseInt(options.code, 10) : undefined;
    const entries: Entry[] = [];

    for (let index = 0; index <= lastIndex; index++) {
      let response;
      try {
        response = await client.execute<EventLogResponse>(new GetEventLogCommand(index));
      } catch (error) {
        logger.error(`Failed to read event log index ${index}`, error);
        continue;
      }

      // Missing entries come back as EventLogNotFoundResponse, which has no eventCode.
      if (!isEventLogResponse(response)) {
        logger.debug(`No entry at index ${index}`);
        continue;
      }

      if (filterCode !== undefined && response.eventCode.value !== filterCode) {
        continue;
      }

      const entry: Entry = {
        index,
        dateTime: response.dateTime,
        qualifier: response.eventQualifier.string,
        qualifierValue: response.eventQualifier.value,
        eventCode: response.eventCode.string,
        eventCodeValue: response.eventCode.value,
        deviceCategory: response.deviceCategory.description,
        action: response.action.description,
        zone: response.zone,
        userId: response.userId,
      };
      entries.push(entry);

      if (!options.json) {
        console.log(
          [
            String(index).padStart(4),
            (entry.dateTime ?? '-').padEnd(23),
            entry.qualifier.padEnd(8),
            `${entry.eventCode}(${entry.eventCodeValue})`.padEnd(28),
            entry.deviceCategory.padEnd(10),
            entry.zone ? `zone=${entry.zone}` : entry.userId !== undefined ? `user=${entry.userId}` : '',
          ].join(' '),
        );
      }
    }

    if (options.json) {
      console.log(JSON.stringify(entries, null, 2));
    } else {
      logger.info(`${entries.length} entries printed.`);
    }
  } finally {
    await client.close();
  }
};

const program = new Command();
program
  .name('dump-event-log')
  .description("dump the base unit's Contact ID event log")
  .requiredOption('-c, --configfile <configfile>', 'configuration file name')
  .option('-v, --verbose', 'display all logging output')
  .option('-j, --json', 'emit JSON instead of a table')
  .option('--code <code>', 'only show entries with this Contact ID event code, e.g. 900')
  .option('--max <index>', 'stop at this index instead of lastIndex')
  .action(async (options: Options) => {
    try {
      await dumpEventLog(options);
    } catch (error) {
      logger.error(error);
      process.exitCode = 1;
    }
  });

program.parse();
