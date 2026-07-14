import { z } from 'zod';
import DOMPurify from 'dompurify';

export function sanitize(v: string): string {
  return DOMPurify.sanitize(v, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

const emailField = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(254, 'Email too long')
  .transform(sanitize);

// Passwords: not sanitized — special chars are valid
const passwordField = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').max(128),
});

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type ZodIssues = z.ZodIssue[];

export function collectErrors(issues: ZodIssues): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
