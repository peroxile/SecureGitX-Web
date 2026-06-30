export interface AuthUser {
  id: string;
  email: string;
}

let _user: AuthUser | null = null;

export function getUser(): AuthUser | null {
  return _user;
}

export function setUser(u: AuthUser | null): void {
  _user = u;
  renderNavAuth();
}

// Callback set by nav component to re-render on auth change
let _onAuthChange: (() => void) | null = null;
export function onAuthChange(fn: () => void): void {
  _onAuthChange = fn;
}
function renderNavAuth(): void {
  _onAuthChange?.();
}
