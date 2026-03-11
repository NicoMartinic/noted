import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(4, 'Username must be at least 4 characters').max(150),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string().min(8, 'Please confirm your password'),
}).refine((d) => d.password === d.password2, {
  message: 'Passwords do not match',
  path: ['password2'],
});

export const updateProfileSchema = z.object({
  current_username: z.string().min(1, 'Required'),
  current_password: z.string().min(1, 'Required'),
  new_username: z.string().min(4).max(150).optional().or(z.literal('')),
  new_password: z.string().min(8).optional().or(z.literal('')),
}).refine((d) => d.new_username || d.new_password, {
  message: 'Provide at least a new username or new password',
  path: ['new_username'],
});

export const categorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional().default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#6366f1'),
});

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().optional().default(''),
  category_id: z.number().nullable().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type NoteInput = z.infer<typeof noteSchema>;
