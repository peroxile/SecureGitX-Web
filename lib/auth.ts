import client, { fetchCsrf } from './api';
import type { LoginInput, RegisterInput } from './validation';
import type { AuthUser } from './auth-state';

export async function login(input: LoginInput): Promise<AuthUser> {
  await fetchCsrf();
  const res = await client.post<{ user: AuthUser }>('/auth/login', {
    email: input.email,
    password: input.password,
  });
  return res.data.user;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  await fetchCsrf();
  const res = await client.post<{ user: AuthUser }>('/auth/register', {
    email: input.email,
    password: input.password,
  });
  return res.data.user;
}

export async function logout(): Promise<void> {
  await fetchCsrf();
  await client.post('/auth/logout');
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const res = await client.get<{ user: AuthUser }>('/auth/session');
    return res.data.user;
  } catch {
    return null;
  }
}
