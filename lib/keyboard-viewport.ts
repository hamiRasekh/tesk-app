/** Keyboard inset from Visual Viewport API (mobile browsers). */
export function getKeyboardInset(): number {
  if (typeof window === "undefined" || !window.visualViewport) return 0;
  const vv = window.visualViewport;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

/** Scroll the focused field to sit just above the on-screen keyboard. */
export function scrollFieldAboveKeyboard(field: HTMLElement, gap = 14) {
  const align = () => {
    const vv = window.visualViewport;
    if (!vv) {
      field.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    const visibleTop = vv.offsetTop + gap;
    const visibleBottom = vv.offsetTop + vv.height - gap;
    const rect = field.getBoundingClientRect();

    const drawerBody = field.closest(".void-drawer__body");
    if (drawerBody instanceof HTMLElement) {
      if (rect.bottom > visibleBottom) {
        drawerBody.scrollTop += rect.bottom - visibleBottom;
      } else if (rect.top < visibleTop) {
        drawerBody.scrollTop -= visibleTop - rect.top;
      }
      return;
    }

    const pageScroll =
      field.closest(".void-shell") ??
      field.closest(".void-login-root") ??
      field.closest(".void-signup-root") ??
      field.closest(".screen");

    if (pageScroll instanceof HTMLElement) {
      if (rect.bottom > visibleBottom) {
        pageScroll.scrollTop += rect.bottom - visibleBottom;
      } else if (rect.top < visibleTop) {
        pageScroll.scrollTop -= visibleTop - rect.top;
      }
      return;
    }

    if (rect.bottom > visibleBottom || rect.top < visibleTop) {
      field.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(align);
  });
}

export function bindFieldAboveKeyboard(field: HTMLElement | null) {
  if (!field) return;
  scrollFieldAboveKeyboard(field);
  window.setTimeout(() => scrollFieldAboveKeyboard(field), 280);
  window.setTimeout(() => scrollFieldAboveKeyboard(field), 520);
}
