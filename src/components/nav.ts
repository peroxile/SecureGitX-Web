import { navigate } from "../router";
import { getUser, setUser, onAuthChange } from "../lib/auth-state";
import { logout } from "../lib/auth";

export function renderNav(): void {
  const nav = document.getElementById("nav")!;
  const user = getUser();

  const authLinks = user
    ? `<button class="nav__link" id="nav-logout">Logout</button>`
    : `<button class="nav__link" data-nav-path="/login" data-link="/login">Login</button>
       <button class="nav__cta" data-link="/register">Register</button>`;

  nav.innerHTML = `
    <div class="nav__logo" data-link="/">
      <span>Secure</span>GitX
    </div>
    <div class="nav__links">
      <button class="nav__link" data-nav-path="/docs" data-link="/docs">Docs</button>
      ${authLinks}
    </div>`;

  if (user) {
    nav.querySelector("#nav-logout")?.addEventListener("click", async () => {
      await logout().catch(() => null);
      setUser(null);
      navigate("/");
    });
  }

  // Mark active link based on current path
  nav.querySelectorAll<HTMLElement>("[data-nav-path]").forEach((el) => {
    const p = el.dataset.navPath ?? "";
    const active =
      location.pathname === p || (p !== "/" && location.pathname.startsWith(p));
    el.classList.toggle("nav__link--active", active);
  });
}

export function initNav(): void {
  onAuthChange(renderNav);
  renderNav();
}
