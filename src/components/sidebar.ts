import { PAGES, CATEGORIES } from '../manifest';
import { navigate } from '../router';

export function renderSidebar(container: HTMLElement, currentSlug: string): void {
  let html = '';

  for (const cat of CATEGORIES) {
    const pages = PAGES.filter(p => p.category === cat.key).sort((a, b) => a.order - b.order);
    html += `<div class="docs-sidebar__label">${cat.label}</div>`;
    for (const p of pages) {
      const active = p.slug === currentSlug;
      html += `<button class="docs-sidebar__item${active ? ' docs-sidebar__item--active' : ''}" data-slug="${p.slug}">${p.title}</button>`;
    }
  }

  container.innerHTML = html;

  container.querySelectorAll<HTMLButtonElement>('[data-slug]').forEach(btn => {
    btn.addEventListener('click', () => navigate(`/${btn.dataset.slug}`));
  });
}
