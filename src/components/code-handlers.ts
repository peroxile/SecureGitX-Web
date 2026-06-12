export function attachCodeHandlers(root: HTMLElement): void {
  // Copy button
  root
    .querySelectorAll<HTMLButtonElement>(".code-block__copy")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const raw = btn.dataset.code ?? "";
        // Unescape HTML entities to get original text
        const txt = raw
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"');
        navigator.clipboard.writeText(txt).then(() => {
          btn.textContent = "Copied";
          btn.classList.add("code-block__copy--copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("code-block__copy--copied");
          }, 1500);
        });
      });
    });

  // Expand collapsed code blocks
  root
    .querySelectorAll<HTMLButtonElement>(".code-block__expand")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const block = btn.closest(".code-block")!;
        block.classList.remove("code-block--collapsed");
        btn.remove();
      });
    });
}
