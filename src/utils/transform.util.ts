import { Transform } from 'class-transformer';

/**
 * Transform decorator to handle comma-separated strings and convert them to arrays
 * Handles these cases:
 * - Array: returns as is
 * - Comma-separated string: splits by comma and trims whitespace
 * - Single value: wraps in array
 * - Undefined/null: returns undefined
 * - Boolean strings: converts 'true'/'false' to boolean values
 */
export const TransformToArray = () =>
  Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    // Handle comma-separated string from frontend
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((v) => {
        const trimmed = v.trim();
        // Convert boolean strings to actual booleans
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        return trimmed;
      });
    }
    // Handle single boolean string
    if (typeof value === 'string') {
      if (value === 'true') return [true];
      if (value === 'false') return [false];
    }
    return [value];
  });
