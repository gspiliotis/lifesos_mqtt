import { CMD_ROMVER } from '../../src/Const';
import ROMVersionResponse from '../../src/Responses/ROMVersionResponse';

describe('ROMVersionResponse', () => {
  test('version', () => {
    const response = new ROMVersionResponse('vn01-02 012345 a*b');
    expect(response.version).toBe('01-02 012345 a*b');
    expect(response.commandName).toEqual(CMD_ROMVER);
  });
});
