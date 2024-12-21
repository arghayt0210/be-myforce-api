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

export const verifyEmailSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Add this to your existing validation schemas
export const onboardingSchema = z.object({
  bio: z.string().max(2000, 'Bio must be less than 2000 characters'),
  interests: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid interest ID'))
    .min(1, 'Select at least one interest'),
});
