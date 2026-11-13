// Only inspect channel GETs; never include message text, member details or tokens.
export function isChannelDiagnosticRequest(endpoint, method = 'GET') {
  return method.toUpperCase() === 'GET' &&
    /^\/api\/channels(?:\/[^/?]+\/messages)?(?:\?.*)?$/.test(endpoint);
}

export function summarizeChannelResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { responseType: data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data };
  }

  const summary = { keys: Object.keys(data) };
  for (const key of ['channels', 'messages']) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const items = data[key];
      summary[key] = Array.isArray(items)
        ? { type: 'array', count: items.length, itemKeys: items[0] && typeof items[0] === 'object' ? Object.keys(items[0]) : [] }
        : { type: items === null ? 'null' : typeof items };
    }
  }
  return summary;
}
