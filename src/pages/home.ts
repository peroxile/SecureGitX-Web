import { renderMarkdown, extractSection, parseFrontMatter } from '../renderer';
import { attachCodeHandlers } from '../components/code-handlers';
import { navigate } from '../router';
import readmeRaw from '../../README.md?raw';

const { body: readme } = parseFrontMatter(readmeRaw);

export function renderHome(root: HTMLElement): void {
  root.innerHTML = `
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
        <div class="md-content" id="s-install"></div>
      </section>

      <section class="home-section">
        <div class="home-section__label">Quick start</div>
        <div class="md-content" id="s-quickstart"></div>
      </section>

      <section class="home-section">
        <div class="home-section__label">How it works</div>
        <div class="md-content" id="s-how"></div>
        <p style="margin-top:1rem;font-size:0.84rem;color:var(--text-2)">
          The hook is the only enforcement point. The daemon, CLI scan, and
          gitignore builder are advisory — they inform and suggest, but the
          commit gate lives entirely in the pre-commit hook path.
        </p>
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

  root.querySelector('#s-install')!.innerHTML    = renderMarkdown(extractSection(readme, 'Install'));
  root.querySelector('#s-quickstart')!.innerHTML = renderMarkdown(extractSection(readme, 'Quick start'));
  root.querySelector('#s-how')!.innerHTML        = renderMarkdown(extractSection(readme, 'How it works'));

  attachCodeHandlers(root);

  root.querySelector('#home-docs-btn')?.addEventListener('click',  () => navigate('/docs'));
  root.querySelector('#home-docs-btn2')?.addEventListener('click', () => navigate('/docs'));
}
