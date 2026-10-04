import { isLocalApiHost, PROD_API_URL } from '../src/lib/appConfig';

describe('isLocalApiHost', () => {
  it('detects localhost and LAN', () => {
    expect(isLocalApiHost('localhost')).toBe(true);
    expect(isLocalApiHost('192.168.1.10')).toBe(true);
    expect(isLocalApiHost('api.findindian.de')).toBe(false);
    expect(isLocalApiHost('api-qa.findindian.de')).toBe(false);
  });
});

describe('PROD_API_URL', () => {
  it('points at production API', () => {
    expect(PROD_API_URL).toBe('https://api.findindian.de');
  });
});
