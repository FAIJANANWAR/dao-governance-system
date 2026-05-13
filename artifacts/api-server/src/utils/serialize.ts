/**
 * Recursively transforms DB row values so they match the OpenAPI response schemas:
 *   - Date  → ISO string
 *   - numeric string (e.g. "12345.00") → number  (only when the value looks like a pure number)
 *   - arrays/objects → recursed into
 */
export function serializeRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) {
      out[k] = v.toISOString();
    } else if (typeof v === "string" && isNumericString(v)) {
      out[k] = Number(v);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item && typeof item === "object" && !(item instanceof Date)
          ? serializeRow(item as Record<string, unknown>)
          : item instanceof Date
          ? item.toISOString()
          : item
      );
    } else if (v !== null && typeof v === "object") {
      out[k] = serializeRow(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function serializeRows<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map(serializeRow);
}

function isNumericString(s: string): boolean {
  if (s.trim() === "") return false;
  // Only coerce plain decimal numbers (integers or decimals).
  // Explicitly exclude hex strings (0x...) and anything with non-numeric chars.
  return /^-?\d+(\.\d+)?$/.test(s.trim());
}
