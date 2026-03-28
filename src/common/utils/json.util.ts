export const tryParse = (val: any) => {
  if (typeof val !== 'string') return val;

  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'object' && parsed !== null) {
      return tryParse(parsed);
    }
    return parsed;
  } catch {
    return val;
  }
};

export const jsonGet = (json: any, path: string, defaultValue?: any) => {
  let current = tryParse(json);

  for (const key of path.split('.')) {
    if (current == null) return defaultValue;

    const match = key.match(/^(\w+)\[(\d+)\]$/);

    if (match) {
      const [, arrKey, index] = match;
      current = current?.[arrKey]?.[Number(index)];
    } else {
      current = current?.[key];
    }

    current = tryParse(current);
  }

  return current ?? defaultValue;
};
