import { z } from 'zod';

// Common field validations
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .toLowerCase();

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  );

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  full_name: z.string().min(1, 'Full name is required').max(50, 'Full name is too long'),
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  login: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});
