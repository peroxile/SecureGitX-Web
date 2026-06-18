import { navigate } from "../router";
import { getUser, setUser, onAuthChange } from "../lib/auth-state";
import { logout } from "../lib/auth";

export function renderNav(): void {
  const nav = document.getElementById("nav")!;
  const user = getUser();
  const path = location.pathname;

  const isActive = (p: string) =>
    path === p || (p !== "/" && path.startsWith(p));

  const authLinks = user
    ? `<button class="nav__link" id="nav-logout">Logout</button>`
    : `<button class="nav__link${
        isActive("/login") ? " nav__link--active" : ""
      }"
               data-nav-path="/login" data-link="/login">Login</button>
       <button class="nav__cta" data-link="/register">Register</button>`;

  nav.innerHTML = `
    <button class="nav__logo" data-link="/">
      <span class="nav__logo-accent">Secure</span>GitX
    </button>

    <div class="nav__links" id="nav-links" role="navigation" aria-label="Main navigation">
      <button class="nav__link${isActive("/docs") ? " nav__link--active" : ""}"
              data-nav-path="/docs" data-link="/docs">Docs</button>
      ${authLinks}
    </div>

    <button class="nav__burger" id="nav-burger"
            aria-label="Toggle navigation" aria-expanded="false" aria-controls="nav-links">
      <span class="nav__burger-bar"></span>
      <span class="nav__burger-bar"></span>
      <span class="nav__burger-bar"></span>
    </button>`;

  // Hamburger toggle
  const burger = nav.querySelector<HTMLButtonElement>("#nav-burger")!;
  const links = nav.querySelector<HTMLDivElement>("#nav-links")!;

  burger.addEventListener("click", () => {
    const open = links.classList.toggle("nav__links--open");
    burger.classList.toggle("nav__burger--open", open);
    burger.setAttribute("aria-expanded", String(open));
  });

  // Close mobile menu on any navigation action
  links.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("[data-link]")) {
      links.classList.remove("nav__links--open");
      burger.classList.remove("nav__burger--open");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  // Close on Escape
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && links.classList.contains("nav__links--open")) {
        links.classList.remove("nav__links--open");
        burger.classList.remove("nav__burger--open");
        burger.setAttribute("aria-expanded", "false");
      }
    },
    { once: false }
  );

  // Logout
  if (user) {
    nav.querySelector("#nav-logout")?.addEventListener("click", async () => {
      await logout().catch(() => null);
      setUser(null);
      navigate("/");
    });
  }
}

export function initNav(): void {
  onAuthChange(renderNav);
  renderNav();
}
