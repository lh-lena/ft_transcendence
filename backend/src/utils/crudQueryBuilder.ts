export function transformQuery<T extends Record<string, unknown>>(
  query: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  console.log('Query after builder', result);

  Object.keys(query).forEach((key) => {
    const parts = key.split('.');
    let current: Record<string, unknown> = result;

    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        current[part] = query[key];
      } else {
        if (typeof current[part] !== 'object' || current[part] === null) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
    });
  });

  console.log('Query after builder', result);

  return result;
}
