import { renderMarkdown, extractSection, parseFrontMatter } from "../renderer";
import { attachCodeHandlers } from "../components/code-handlers";
import { getReadme } from "../manifest";
import { navigate } from "../router";

function skeleton(): string {
  return `
    <div class="sk-line" style="width:60%;height:1.1rem;margin-bottom:0.8rem"></div>
    <div class="sk-line" style="width:90%"></div>
    <div class="sk-line" style="width:80%"></div>
    <div class="sk-line" style="width:85%;margin-bottom:1.5rem"></div>
    <div class="sk-line" style="width:100%;height:5rem"></div>`;
}

function shell(): string {
  return `
    <div class="home">
      <section class="hero">
        <div class="hero__eyebrow">◈ Open source · Local first · Pre-commit</div>
        <h1 class="hero__title">Stop secrets before<br><em>they leave your machine.</em></h1>
        <p class="hero__desc">
          SecureGitX is a local first pre-commit secret scanner. It inspects staged changes
          before <code>git commit</code> and blocks the commit if it finds API keys,
          tokens, credentials, or sensitive filenames.
        </p>
        <div class="hero__actions">
          <button class="btn-primary" id="home-docs-btn">Read the docs →</button>
          <a class="btn-ghost" href="https://github.com/peroxile/SecureGitX"
             target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
      </section>

      <section class="home-section">
        <div class="home-section__label">Install</div>
        <div class="md-content" id="s-install">${skeleton()}</div>
      </section>

      <section class="home-section">
        <div class="home-section__label">Quick start</div>
        <div class="md-content" id="s-quickstart">${skeleton()}</div>
      </section>

      <section class="home-section">
        <div class="home-section__label">How it works</div>
        <div class="md-content" id="s-how">${skeleton()}</div>
      </section>

      <section class="home-section" style="padding-bottom:4rem;border-bottom:1px solid var(--border-sub)">
        <div class="home-section__label">Documentation</div>
        <p style="font-size:0.875rem;color:var(--text-2);max-width:480px;line-height:1.7;margin-bottom:1.2rem">
          Full command reference, rules schema, agent guide, architecture, and
          development setup.
        </p>
        <button class="btn-primary" id="home-docs-btn2">Browse docs →</button>
      </section>

      <footer class="footer">
        Apache 2.0 ·
        <a href="https://github.com/peroxile/SecureGitX"
           target="_blank" rel="noopener noreferrer">github.com/peroxile/SecureGitX</a>
      </footer>
    </div>`;
}

export function renderHome(root: HTMLElement): void {
  root.innerHTML = shell();

  root
    .querySelector("#home-docs-btn")
    ?.addEventListener("click", () => navigate("/docs"));
  root
    .querySelector("#home-docs-btn2")
    ?.addEventListener("click", () => navigate("/docs"));

  // Async: fetch README and fill sections
  getReadme().then((raw) => {
    if (!raw) return; // silently leave skeleton if fetch fails

    const { body } = parseFrontMatter(raw);

    const fill = (id: string, section: string) => {
      const el = root.querySelector(`#${id}`);
      if (!el) return;
      const content = extractSection(body, section);
      el.innerHTML = content
        ? renderMarkdown(content)
        : `<p style="color:var(--text-muted);font-family:var(--mono);font-size:0.75rem">Section not found.</p>`;
      attachCodeHandlers(el as HTMLElement);
    };

    fill("s-install", "Install");
    fill("s-quickstart", "Quick start");
    fill("s-how", "How it works");
  });
}
