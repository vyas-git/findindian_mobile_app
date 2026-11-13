import { isChannelDiagnosticRequest, summarizeChannelResponse } from '../src/utils/channelDiagnostics';

describe('channel API diagnostics', () => {
  it('matches only channel and channel-message GET requests', () => {
    expect(isChannelDiagnosticRequest('/api/channels')).toBe(true);
    expect(isChannelDiagnosticRequest('/api/channels/123/messages?limit=50')).toBe(true);
    expect(isChannelDiagnosticRequest('/api/channels/123/messages', 'POST')).toBe(false);
    expect(isChannelDiagnosticRequest('/api/dms/123/messages')).toBe(false);
    expect(isChannelDiagnosticRequest('/api/channels/123')).toBe(false);
  });

  it('shows response shape and counts without logging private data', () => {
    const summary = summarizeChannelResponse({
      messages: [{ id: 'secret-id', text: 'private message', user_name: 'private name' }],
    });
    expect(summary).toEqual({
      keys: ['messages'],
      messages: { type: 'array', count: 1, itemKeys: ['id', 'text', 'user_name'] },
    });
    expect(JSON.stringify(summary)).not.toContain('private message');
    expect(JSON.stringify(summary)).not.toContain('private name');
    expect(JSON.stringify(summary)).not.toContain('secret-id');
  });

  it('identifies unexpected response shapes', () => {
    expect(summarizeChannelResponse({ messages: null })).toEqual({
      keys: ['messages'], messages: { type: 'null' },
    });
    expect(summarizeChannelResponse([])).toEqual({ responseType: 'array' });
  });
});
