import { appendMessageOnce, scrollToLatest, uniqueMessages } from '../src/utils/messages';

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

describe('scrollToLatest', () => {
  it('scrolls the native message list to its end without requiring measured item heights', () => {
    const nativeScrollToEnd = jest.fn();
    const list = {
      getScrollResponder: () => ({ scrollToEnd: nativeScrollToEnd }),
      scrollToEnd: jest.fn(),
      scrollToIndex: jest.fn(),
    };

    scrollToLatest(list, false);

    expect(nativeScrollToEnd).toHaveBeenCalledWith({ animated: false });
    expect(list.scrollToEnd).not.toHaveBeenCalled();
    expect(list.scrollToIndex).not.toHaveBeenCalled();
  });

  it('falls back to FlatList scrollToEnd when the native responder is not available', () => {
    const list = { getScrollResponder: () => null, scrollToEnd: jest.fn() };

    scrollToLatest(list);

    expect(list.scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it('does nothing when the list is not mounted', () => {
    expect(() => scrollToLatest(null)).not.toThrow();
  });
});
