import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  role: z.enum(['admin', 'hsd_officer', 'supervisor', 'viewer']).default('supervisor'),
  department: z.string().optional().default('National Sample Survey Office (NSSO)'),
  region: z.string().optional().default('Western Zone - Maharashtra')
});
