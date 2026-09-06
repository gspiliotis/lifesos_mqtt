jest.mock('log4js', () => {
  const debug = jest.fn();
  const info = jest.fn();
  const warn = jest.fn();
  const error = jest.fn();
  const fatal = jest.fn();
  return {
    getLogger: jest.fn().mockImplementation(() => ({
      debug,
      info,
      warn,
      error,
      fatal,
    })),
  };
});
