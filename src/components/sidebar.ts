import { PAGES } from "../manifest";
import { navigate } from "../router";

export function renderSidebar(
  container: HTMLElement,
  currentRoute: string
): void {
  const grouped = {
    cli: PAGES.filter((p) => p.category === "cli"),
    defaults: PAGES.filter((p) => p.category === "defaults"),
    develop: PAGES.filter((p) => p.category === "develop"),
  };

  container.innerHTML = Object.entries(grouped)
    .map(([key, pages]) => {
      const label =
        key === "cli" ? "CLI" : key === "defaults" ? "Defaults" : "Develop";
      return `
        <div class="docs-sidebar__group">
          <div class="docs-sidebar__label">${label}</div>
          ${pages
            .sort((a, b) => a.order - b.order)
            .map(
              (page) => `
                <button
                  type="button"
                  class="docs-sidebar__item ${
                    normalize(currentRoute) === normalize(page.route)
                      ? "docs-sidebar__item--active"
                      : ""
                  }"
                  data-link="${page.route}"
                >
                  ${page.title}
                </button>
              `
            )
            .join("")}
        </div>
      `;
    })
    .join("");

  container
    .querySelectorAll<HTMLButtonElement>("[data-link]")
    .forEach((btn) => {
      btn.addEventListener("click", () =>
        navigate(btn.dataset.link || "/docs")
      );
    });
}

function normalize(v: string): string {
  return (v || "/").replace(/\/+$/, "") || "/";
}
