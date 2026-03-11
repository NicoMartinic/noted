/**
 * Unit tests for Zod validation schemas.
 */
import { loginSchema, registerSchema, categorySchema, noteSchema } from '@/schemas';

describe('loginSchema', () => {
  test('valid input passes', () => {
    expect(loginSchema.safeParse({ username: 'alice', password: 'pass1234' }).success).toBe(true);
  });
  test('empty username fails', () => {
    expect(loginSchema.safeParse({ username: '', password: 'pass' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  test('valid input passes', () => {
    expect(registerSchema.safeParse({ username: 'alice', password: 'pass1234', password2: 'pass1234' }).success).toBe(true);
  });
  test('password mismatch fails', () => {
    expect(registerSchema.safeParse({ username: 'u', password: 'pass1234', password2: 'different' }).success).toBe(false);
  });
  test('short password fails', () => {
    expect(registerSchema.safeParse({ username: 'u', password: 'abc', password2: 'abc' }).success).toBe(false);
  });
});

describe('categorySchema', () => {
  test('valid input passes', () => {
    expect(categorySchema.safeParse({ title: 'Work', color: '#ff0000' }).success).toBe(true);
  });
  test('empty title fails', () => {
    expect(categorySchema.safeParse({ title: '', color: '#ff0000' }).success).toBe(false);
  });
});

describe('noteSchema', () => {
  test('valid input passes', () => {
    expect(noteSchema.safeParse({ title: 'My note' }).success).toBe(true);
  });
  test('empty title fails', () => {
    expect(noteSchema.safeParse({ title: '' }).success).toBe(false);
  });
});
