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
