import { registerSchema, collectErrors } from "../lib/validation";
import { register } from "../lib/auth";
import { setUser } from "../lib/auth-state";
import { RateLimitError, AuthError } from "../lib/api";
import { navigate } from "../router";

export function renderRegister(root: HTMLElement): void {
  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-eyebrow">◈ SecureGitX</div>
        <h1 class="auth-title">Create account</h1>
        <div id="alert-zone"></div>
        <div class="field">
          <label class="field__label" for="email">Email</label>
          <input class="field__input" id="email" type="email" autocomplete="email" placeholder="you@example.com" />
          <span class="field__error" id="err-email"></span>
        </div>
        <div class="field">
          <label class="field__label" for="password">Password</label>
          <input class="field__input" id="password" type="password" autocomplete="new-password" />
          <span class="field__error" id="err-password"></span>
          <div class="pwd-meter" id="pwd-meter" style="display:none">
            <div class="pwd-meter__bar"><div class="pwd-meter__fill" id="pwd-fill"></div></div>
            <span class="pwd-meter__label" id="pwd-label"></span>
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="confirm">Confirm password</label>
          <input class="field__input" id="confirm" type="password" autocomplete="new-password" />
          <span class="field__error" id="err-confirmPassword"></span>
        </div>
        <button class="submit-btn" id="submit-btn">Create account</button>
        <p class="auth-foot">Have an account? <a data-link="/login">Sign in</a></p>
      </div>
    </div>`;

  const emailEl = root.querySelector<HTMLInputElement>("#email")!;
  const passEl = root.querySelector<HTMLInputElement>("#password")!;
  const confirmEl = root.querySelector<HTMLInputElement>("#confirm")!;
  const submitBtn = root.querySelector<HTMLButtonElement>("#submit-btn")!;
  const alertZone = root.querySelector<HTMLDivElement>("#alert-zone")!;
  const meterWrap = root.querySelector<HTMLDivElement>("#pwd-meter")!;
  const fillEl = root.querySelector<HTMLDivElement>("#pwd-fill")!;
  const labelEl = root.querySelector<HTMLSpanElement>("#pwd-label")!;

  function setFieldError(field: string, msg: string): void {
    const err = root.querySelector<HTMLSpanElement>(`#err-${field}`);
    if (err) err.textContent = msg;
    const inp = root.querySelector<HTMLInputElement>(
      `#${field === "confirmPassword" ? "confirm" : field}`
    );
    inp?.classList.toggle("field__input--err", !!msg);
    const lbl = root.querySelector(
      `label[for="${field === "confirmPassword" ? "confirm" : field}"]`
    );
    lbl?.classList.toggle("field__label--err", !!msg);
  }

  function clearErrors(): void {
    ["email", "password", "confirmPassword"].forEach((f) =>
      setFieldError(f, "")
    );
    alertZone.innerHTML = "";
  }

  // Password strength meter
  passEl.addEventListener("input", () => {
    const v = passEl.value;
    if (!v) {
      meterWrap.style.display = "none";
      return;
    }
    meterWrap.style.display = "flex";
    const score = [
      v.length >= 8,
      /[A-Z]/.test(v),
      /[0-9]/.test(v),
      v.length >= 14,
    ].filter(Boolean).length;
    const colors = ["#c0392b", "#c0892b", "#1376af", "#4eca8b"];
    const labels = ["Weak", "Fair", "Good", "Strong"];
    fillEl.style.width = `${(score / 4) * 100}%`;
    fillEl.style.background = colors[score - 1] ?? colors[0];
    labelEl.textContent = labels[score - 1] ?? "";
    labelEl.style.color = colors[score - 1] ?? colors[0];
  });

  submitBtn.addEventListener("click", async () => {
    clearErrors();
    const result = registerSchema.safeParse({
      email: emailEl.value,
      password: passEl.value,
      confirmPassword: confirmEl.value,
    });
    if (!result.success) {
      const errs = collectErrors(result.error.issues);
      Object.entries(errs).forEach(([f, m]) => setFieldError(f, m));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "···";
    try {
      const user = await register(result.data);
      setUser(user);
      navigate("/");
    } catch (err) {
      if (err instanceof RateLimitError) {
        alertZone.innerHTML = `<div class="form-alert form-alert--rate">Rate limit hit. Retry in ${err.retryAfter}s.</div>`;
        setTimeout(() => {
          alertZone.innerHTML = "";
          submitBtn.disabled = false;
        }, err.retryAfter * 1000);
        return;
      } else if (err instanceof AuthError) {
        alertZone.innerHTML = `<div class="form-alert form-alert--error">${
          err.message || "Registration failed."
        }</div>`;
      } else {
        alertZone.innerHTML = `<div class="form-alert form-alert--error">Registration failed. Please try again.</div>`;
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  });

  [emailEl, passEl, confirmEl].forEach((el) =>
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitBtn.click();
    })
  );
}
