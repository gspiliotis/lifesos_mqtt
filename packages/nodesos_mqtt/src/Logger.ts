import { configure } from 'log4js';

export const configureLog4j = (logLever?: string) => {
  configure({
    appenders: {
      console: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[[%d{ISO8601}] [%-5.5p] [%c] %m%]',
        },
      },
    },
    categories: {
      default: {
        appenders: ['console'],
        level: logLever ?? 'info',
      },
      NodeSOSMQTT: {
        appenders: ['console'],
        level: logLever ?? 'info',
      },
      NodeSOS: {
        appenders: ['console'],
        level: logLever ?? 'info',
      },
    },
  });
};
