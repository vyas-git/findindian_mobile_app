import { appendMessageOnce, uniqueMessages } from '../src/utils/messages';

describe('message list helpers', () => {
  it('deduplicates a server message list by message ID', () => {
    expect(uniqueMessages([{ id: 'one' }, { id: 'two' }, { id: 'one' }])).toEqual([
      { id: 'one' },
      { id: 'two' },
    ]);
  });

  it('does not append the POST result when polling already added it', () => {
    const messages = [{ id: 'one' }, { id: 'new-message', text: 'Hello' }];
    expect(appendMessageOnce(messages, { id: 'new-message', text: 'Hello' })).toBe(messages);
  });
});
