type QueryValue = string | string[];

const PRISMA_OPERATORS = [
  "equals", "in", "notIn", "lt", "lte", "gt", "gte", "contains",
  "startsWith", "endsWith", "mode", "not", "some", "every", "none"
];

function parseValue(val: string | number | boolean | null): any {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null") return null;
  if (typeof val === "string") {
    if (!isNaN(Number(val)) && val.trim() !== "") return Number(val);
    return val;
  }
  // If already number, boolean, or null, just return as is
  return val;
}

function parseArray(val: string | string[]): any[] {
  if (Array.isArray(val)) return val.map(parseValue);
  if (typeof val === "string" && val.includes(",")) return val.split(",").map(parseValue);
  return [parseValue(val)];
}

export function buildQuery(query: Record<string, QueryValue>): Record<string, any> {
  const where: Record<string, any> = {};

  for (const [rawKey, rawVal] of Object.entries(query)) {
    // Support repeated keys as array: { userId: ['1','2'] }
    const values: string[] = Array.isArray(rawVal) ? rawVal : [rawVal];

    // Prisma operator support: e.g. score.gt, gamePlayed.user.username.contains
    const keyParts = rawKey.split(".");
    let operator = null;
    if (PRISMA_OPERATORS.includes(keyParts[keyParts.length - 1])) {
      operator = keyParts.pop()!;
    }

    let current = where;
    for (let i = 0; i < keyParts.length; ++i) {
      const part = keyParts[i];
      // If at last key part, assign value directly (do not nest)
      if (i === keyParts.length - 1) {
        // Set value at the final level
        let value: any;
        if (operator) {
          // Operators: multi-value if needed
          if (["in", "notIn"].includes(operator)) {
            value = { [operator]: parseArray(rawVal) };
          } else if (["some", "none", "every"].includes(operator)) {
            value = { [operator]: parseValue(rawVal) };
          } else {
            value = { [operator]: parseValue(Array.isArray(rawVal) ? rawVal[0] : rawVal) };
          }
        } else if (values.length > 1) {
          value = { in: values.map(parseValue) };
        } else if (typeof rawVal === "string" && rawVal.includes(",")) {
          value = { in: parseArray(rawVal) };
        } else {
          value = parseValue(Array.isArray(rawVal) ? rawVal[0] : rawVal);
        }
        current[part] = value;
      } else {
        // For nested arrays, use { some: {} }
        if (!current[part]) {
          current[part] = { some: {} };
        }
        current = current[part].some ?? current[part];
      }
    }
  }

  return where;
}
