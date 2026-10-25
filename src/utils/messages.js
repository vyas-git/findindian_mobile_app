export const uniqueMessages = (messages = []) => {
  const seen = new Set();
  return messages.filter((message) => {
    if (!message?.id || seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
};

export const appendMessageOnce = (messages = [], message) => {
  if (!message?.id || messages.some((item) => item.id === message.id)) {
    return messages;
  }
  return [...messages, message];
};

// Use the native scroll view when available. FlatList's scrollToIndex cannot
// jump to an unmeasured message when chat bubbles have different heights.
export const scrollToLatest = (list, animated = true) => {
  if (!list) return;

  const scrollResponder = list.getScrollResponder?.();
  if (scrollResponder?.scrollToEnd) {
    scrollResponder.scrollToEnd({ animated });
  } else {
    list.scrollToEnd?.({ animated });
  }
};
