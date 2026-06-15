import { loginSchema, collectErrors } from "../lib/validation";
import { login } from "../lib/auth";
import { setUser } from "../lib/auth-state";
import { RateLimitError, AuthError } from "../lib/api";
import { navigate } from "../router";

export function renderLogin(root: HTMLElement): void {
  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-eyebrow">◈ SecureGitX</div>
        <h1 class="auth-title">Sign in</h1>
        <div id="alert-zone"></div>
        <div class="field">
          <label class="field__label" for="email">Email</label>
          <input class="field__input" id="email" type="email" autocomplete="email" placeholder="name@email.com" />
          <span class="field__error" id="err-email"></span>
        </div>
        <div class="field">
          <label class="field__label" for="password">Password</label>
          <input class="field__input" id="password" type="password" autocomplete="current-password" />
          <span class="field__error" id="err-password"></span>
        </div>
        <button class="submit-btn" id="submit-btn">Sign in</button>
        <p class="auth-foot">
          No account? <a data-link="/register">Register</a>
        </p>
      </div>
    </div>`;

  const emailEl = root.querySelector<HTMLInputElement>("#email")!;
  const passEl = root.querySelector<HTMLInputElement>("#password")!;
  const submitBtn = root.querySelector<HTMLButtonElement>("#submit-btn")!;
  const alertZone = root.querySelector<HTMLDivElement>("#alert-zone")!;

  function setFieldError(field: string, msg: string): void {
    const el = root.querySelector<HTMLSpanElement>(`#err-${field}`);
    if (!el) return;
    el.textContent = msg;
    const input = root.querySelector<HTMLInputElement>(`#${field}`);
    input?.classList.toggle("field__input--err", !!msg);
    const label = root.querySelector(`label[for="${field}"]`);
    label?.classList.toggle("field__label--err", !!msg);
  }

  function clearErrors(): void {
    ["email", "password"].forEach((f) => setFieldError(f, ""));
    alertZone.innerHTML = "";
  }

  function setAlert(type: "error" | "rate", msg: string): void {
    alertZone.innerHTML = `<div class="form-alert form-alert--${type}">${msg}</div>`;
  }

  function setLoading(on: boolean): void {
    submitBtn.disabled = on;
    submitBtn.textContent = on ? "···" : "Sign in";
  }

  submitBtn.addEventListener("click", async () => {
    clearErrors();

    const result = loginSchema.safeParse({
      email: emailEl.value,
      password: passEl.value,
    });
    if (!result.success) {
      const errs = collectErrors(result.error.issues);
      Object.entries(errs).forEach(([f, m]) => setFieldError(f, m));
      return;
    }

    setLoading(true);
    try {
      const user = await login(result.data);
      setUser(user);
      navigate("/");
    } catch (err) {
      if (err instanceof RateLimitError) {
        setAlert("rate", `Rate limit hit. Retry in ${err.retryAfter}s.`);
        submitBtn.disabled = true;
        setTimeout(() => {
          submitBtn.disabled = false;
          alertZone.innerHTML = "";
        }, err.retryAfter * 1000);
      } else if (err instanceof AuthError) {
        setAlert("error", err.message || "Invalid credentials.");
      } else {
        setAlert("error", "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  });

  // Submit on Enter
  [emailEl, passEl].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitBtn.click();
    });
  });
}
