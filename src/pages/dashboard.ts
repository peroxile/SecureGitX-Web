import { getUser } from "../lib/auth-state";
import { navigate } from "../router";
import {
  listPacks,
  getDashboardStats,
  getMyLicenses,
  purchasePack,
  type RulePackOut,
  type LicenseOut,
  type DashboardStats,
} from "../lib/packs";
import { AuthError, RateLimitError } from "../lib/api";

//  State

type Tab = "overview" | "marketplace" | "installed";

let _tab: Tab = "overview";
let _stackFilter: string = "all";

let _stats: DashboardStats | null = null;
let _packs: RulePackOut[] = [];
let _licenses: LicenseOut[] = [];
let _licensedIds = new Set<string>();

let _root: HTMLElement;
let _contentArea: HTMLElement;

//  Stacks for filter bar

const STACK_LABELS: Record<string, string> = {
  all: "All",
};

//  Entry

export function renderDashboard(root: HTMLElement): void {
  // Guard: must be logged in
  const user = getUser();
  if (!user) {
    navigate("/login");
    return;
  }

  _root = root;

  root.innerHTML = `
    <div class="dash-layout">
      <div class="dash-tabs" id="dash-tabs">
        ${(["overview", "marketplace", "installed"] as Tab[])
          .map(
            (t) => `
          <button class="dash-tab${
            t === _tab ? " dash-tab--active" : ""
          }" data-tab="${t}">
            ${t.charAt(0).toUpperCase() + t.slice(1)}
          </button>`
          )
          .join("")}
      </div>
      <div id="dash-content"></div>
    </div>`;

  _contentArea = root.querySelector("#dash-content")!;

  root.querySelector("#dash-tabs")!.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-tab]");
    if (!btn) return;
    switchTab(btn.dataset.tab as Tab);
  });

  // Load data and render
  void loadAndRender();
}

function switchTab(tab: Tab): void {
  _tab = tab;
  _root.querySelectorAll(".dash-tab").forEach((el) => {
    el.classList.toggle(
      "dash-tab--active",
      (el as HTMLElement).dataset.tab === tab
    );
  });
  renderCurrentTab();
}

async function loadAndRender(): Promise<void> {
  renderSkeleton();
  await Promise.all([
    getDashboardStats().then((s) => {
      _stats = s;
    }),
    listPacks().then((p) => {
      _packs = p;
    }),
    getMyLicenses().then((l) => {
      _licenses = l;
      _licensedIds = new Set(
        l.filter((x) => x.is_active).map((x) => x.pack_id)
      );
    }),
  ]);
  renderCurrentTab();
}

function renderSkeleton(): void {
  _contentArea.innerHTML = `
    <div class="stats-row">
      ${[...Array(3)]
        .map(
          () => `
        <div class="stat-card">
          <div class="skeleton" style="height:10px;width:60px;margin-bottom:0.7rem"></div>
          <div class="skeleton" style="height:28px;width:48px"></div>
        </div>`
        )
        .join("")}
    </div>
    <div class="skeleton" style="height:200px;border-radius:3px"></div>`;
}

function renderCurrentTab(): void {
  switch (_tab) {
    case "overview":
      renderOverview();
      break;
    case "marketplace":
      renderMarketplace();
      break;
    case "installed":
      renderInstalled();
      break;
  }
}

//  Overview

function renderOverview(): void {
  if (!_stats) return;

  const since = new Date(_stats.member_since).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  _contentArea.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-card__label">Active packs</div>
        <div class="stat-card__value stat-card__value--blue">${
          _stats.installed_packs
        }</div>
        <div class="stat-card__sub">rule bundles installed</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Total rules</div>
        <div class="stat-card__value">${_stats.total_rules}</div>
        <div class="stat-card__sub">patterns active in scanner</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Member since</div>
        <div class="stat-card__value" style="font-size:1.1rem">${since}</div>
        <div class="stat-card__sub">${_stats.account_email}</div>
      </div>
    </div>

    ${
      _stats.installed_packs === 0
        ? `
    <div class="empty-state">
      <div class="empty-state__icon">◈</div>
      <div class="empty-state__msg">No packs installed yet.</div>
      <button class="btn-primary" style="margin-top:1rem;font-size:0.7rem" id="goto-marketplace">
        Browse Marketplace →
      </button>
    </div>`
        : `
    <div class="dash-section-label">Installed packs</div>
    ${renderInstalledRows()}
    <div style="margin-top:1.2rem">
      <button class="btn-ghost" id="goto-marketplace" style="font-size:0.7rem">
        Browse more packs →
      </button>
    </div>`
    }

    <div style="margin-top:2.5rem;padding:1.5rem;background:var(--bg-surface);border:1px solid var(--border-sub);border-radius:var(--r)">
      <div class="dash-section-label" style="margin-bottom:0.8rem">CLI integration</div>
      <p style="font-size:0.82rem;color:var(--text-2);margin-bottom:1rem;line-height:1.6">
        After installing a pack, add the license token to <code style="color:var(--blue);font-size:0.85em">.securegitx.toml</code>:
      </p>
      <div class="code-block">
        <div class="code-block__header">
          <span class="code-block__lang">toml</span>
          <button class="code-block__copy" data-code="[[packs]]\npack_id = &quot;aws&quot;\nlicense_token = &quot;&lt;your-token&gt;&quot;">Copy</button>
        </div>
        <pre><code>[[packs]]
pack_id       = "aws"
license_token = "&lt;your-token&gt;"</code></pre>
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted)">
        The CLI verifies the pack signature offline before loading any rules.
        Your token is scoped to your account and this pack version.
      </p>
    </div>`;

  _contentArea
    .querySelector("#goto-marketplace")
    ?.addEventListener("click", () => switchTab("marketplace"));

  // Copy button
  _contentArea
    .querySelectorAll<HTMLButtonElement>(".code-block__copy")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = (btn.dataset.code ?? "")
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "Copied";
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 1500);
        });
      });
    });
}

// Marketplace

function renderMarketplace(): void {
  const filtered =
    _stackFilter === "all"
      ? _packs
      : _packs.filter((p) => p.stack === _stackFilter);

  const stacks = [
    "all",
    ...Object.keys(STACK_LABELS).filter((k) => k !== "all"),
  ];

  _contentArea.innerHTML = `
    <div class="stack-filters">
      ${stacks
        .map(
          (s) => `
        <button class="stack-chip${
          _stackFilter === s ? " stack-chip--active" : ""
        }" data-stack="${s}">
          ${STACK_LABELS[s] ?? s}
        </button>`
        )
        .join("")}
    </div>

    <div class="pack-grid" id="pack-grid">
      ${filtered.map((p) => renderPackCard(p)).join("")}
    </div>`;

  // Stack filter clicks
  _contentArea
    .querySelectorAll<HTMLButtonElement>(".stack-chip")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        _stackFilter = btn.dataset.stack ?? "all";
        renderMarketplace();
      });
    });

  // Install buttons
  _contentArea
    .querySelectorAll<HTMLButtonElement>("[data-install]")
    .forEach((btn) => {
      btn.addEventListener("click", () => void handlePurchase(btn));
    });
}

function renderPackCard(p: RulePackOut): string {
  const isInstalled = _licensedIds.has(p.id);
  const btnHtml = isInstalled
    ? `<button class="pack-btn pack-btn--installed" disabled>✓ Installed</button>`
    : `<button class="pack-btn pack-btn--install" data-install="${p.id}">
        ${p.is_free ? "Install free" : `Get · ${p.price_display}`}
       </button>`;

  const tags = p.tags.map((t) => `<span class="pack-tag">${t}</span>`).join("");

  return `
    <div class="pack-card">
      <div class="pack-card__head">
        <div class="pack-card__name">${p.name}</div>
        <span class="pack-card__price ${
          p.is_free ? "pack-card__price--free" : "pack-card__price--paid"
        }">
          ${p.price_display}
        </span>
      </div>
      <div class="pack-card__desc">${p.description}</div>
      <div class="pack-card__tags">${tags}</div>
      <div class="pack-card__footer">
        <div class="pack-card__meta">
          <span>${p.rule_count} rules</span>
          <span>v${p.version}</span>
        </div>
        ${btnHtml}
      </div>
    </div>`;
}

async function handlePurchase(btn: HTMLButtonElement): Promise<void> {
  const packId = btn.dataset.install!;
  btn.disabled = true;
  btn.className = "pack-btn pack-btn--loading";
  btn.textContent = "···";

  try {
    const res = await purchasePack(packId);
    _licensedIds.add(packId);
    _licenses.push(res.license);

    // Refresh stats
    _stats = await getDashboardStats();

    // Show token modal
    showTokenModal(packId, res.license_token, res.message);

    // Update just this card's button
    btn.className = "pack-btn pack-btn--installed";
    btn.textContent = "✓ Installed";
    btn.disabled = true;
  } catch (err) {
    btn.disabled = false;
    btn.className = "pack-btn pack-btn--install";
    btn.textContent = "Retry";

    let msg = "Failed to install pack.";
    if (err instanceof AuthError) msg = err.message;
    if (err instanceof RateLimitError)
      msg = `Rate limited. Try again in ${err.retryAfter}s.`;

    // Inline error below grid
    const existing = _contentArea.querySelector(".install-error");
    if (existing) existing.remove();
    const errEl = document.createElement("div");
    errEl.className = "form-alert form-alert--error install-error";
    errEl.style.marginTop = "1rem";
    errEl.textContent = msg;
    _contentArea.querySelector("#pack-grid")?.after(errEl);
    setTimeout(() => errEl.remove(), 4000);
  }
}

//  Installed

function renderInstalled(): void {
  if (_licenses.length === 0) {
    _contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">◈</div>
        <div class="empty-state__msg">No packs installed yet.</div>
        <button class="btn-primary" style="margin-top:1rem;font-size:0.7rem" id="goto-marketplace">
          Browse Marketplace →
        </button>
      </div>`;
    _contentArea
      .querySelector("#goto-marketplace")
      ?.addEventListener("click", () => switchTab("marketplace"));
    return;
  }

  _contentArea.innerHTML = `
    <div class="dash-section-label">Your licenses</div>
    <div class="installed-list">
      ${renderInstalledRows()}
    </div>`;

  attachTokenCopyHandlers(_contentArea);
}

function renderInstalledRows(): string {
  if (_licenses.length === 0) return "";
  return `<div class="installed-list">
    ${_licenses
      .map((lic) => {
        const pack = _packs.find((p) => p.id === lic.pack_id);
        const name = pack?.name ?? lic.pack_id;
        const rules = pack?.rule_count ?? "?";
        return `
        <div class="installed-row" data-pack-id="${lic.pack_id}">
          <div class="installed-row__dot"></div>
          <div class="installed-row__name">${name}</div>
          <div class="installed-row__ver">v${lic.pack_version}</div>
          <div class="installed-row__rules">${rules} rules</div>
          <button class="installed-row__token" data-token-pack="${lic.pack_id}">
            Copy token
          </button>
        </div>`;
      })
      .join("")}
  </div>`;
}

// Token modal

function showTokenModal(_packId: string, token: string, message: string): void {
  const overlay = document.createElement("div");
  overlay.className = "token-modal-overlay";
  overlay.innerHTML = `
    <div class="token-modal">
      <div class="token-modal__title">Pack activated</div>
      <div class="token-modal__desc">${message}</div>
      <div class="token-modal__token" id="modal-token-value">${token}</div>
      <div class="token-modal__actions">
        <button class="btn-ghost" id="modal-close" style="font-size:0.7rem">Close</button>
        <button class="btn-primary" id="modal-copy" style="font-size:0.7rem">Copy token</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  overlay.querySelector("#modal-copy")!.addEventListener("click", () => {
    navigator.clipboard.writeText(token).then(() => {
      (overlay.querySelector("#modal-copy") as HTMLButtonElement).textContent =
        "Copied ✓";
    });
  });

  const close = () => overlay.remove();
  overlay.querySelector("#modal-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

function attachTokenCopyHandlers(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLButtonElement>("[data-token-pack]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const packId = btn.dataset.tokenPack!;
        const lic = _licenses.find((l) => l.pack_id === packId);
        if (!lic) return;
        showTokenModal(
          packId,
          "(refresh token via the API — see instructions below)",
          `To get your current license token, run:\n<code>securegitx packs token ${packId}</code>`
        );
      });
    });
}
