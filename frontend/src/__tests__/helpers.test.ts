/**
 * Unit tests for utility helpers.
 */
import { formatDate, formatDateTime, truncate, zodValidate } from '@/utils/helpers';
import { z } from 'zod';

describe('truncate', () => {
  test('short string unchanged', () => expect(truncate('hi', 10)).toBe('hi'));
  test('long string truncated', () => expect(truncate('hello world', 5)).toBe('hello…'));
});

describe('formatDate', () => {
  test('returns a non-empty string for valid ISO date', () => {
    expect(formatDate('2024-03-10T00:00:00Z')).toBeTruthy();
  });
});

describe('zodValidate', () => {
  const schema = z.object({ name: z.string().min(2) });
  const validate = zodValidate(schema);

  test('returns empty object for valid input', () => {
    expect(validate({ name: 'Alice' })).toEqual({});
  });
  test('returns error for invalid input', () => {
    const errors = validate({ name: 'A' });
    expect(errors.name).toBeDefined();
  });
});
