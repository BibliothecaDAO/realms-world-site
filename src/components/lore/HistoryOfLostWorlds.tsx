import { useEffect, useRef } from "react";
import chronicleHtml from "./history-of-lost-worlds.html?raw";
import "./history-of-lost-worlds.css";

/** The reviewed chronicle is a local, script-free editorial fragment. */
export function HistoryOfLostWorlds() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const progress = root.querySelector<HTMLElement>(".reading-progress");
    const header = root.querySelector<HTMLElement>(".topbar");
    const ageLinks = [...root.querySelectorAll<HTMLAnchorElement>(".age-index a")];
    const dialog = root.querySelector<HTMLDialogElement>(".art-dialog");
    const dialogImage = dialog?.querySelector<HTMLImageElement>(".dialog-image");
    const dialogTitle = dialog?.querySelector<HTMLElement>("#art-title");
    const closeButton = dialog?.querySelector<HTMLButtonElement>(".art-close");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previousFocus: HTMLElement | null = null;
    let frame = 0;
    let anchorFrame = 0;
    let disposed = false;

    const updateProgress = () => {
      frame = 0;
      const length = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) {
        progress.style.width = `${length > 0 ? Math.max(0, Math.min(100, (window.scrollY / length) * 100)) : 0}%`;
      }
    };
    const scheduleProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    const updateHeaderOffset = () => {
      root.style.setProperty("--lore-header-offset", `${(header?.offsetHeight ?? 80) + 16}px`);
      scheduleProgress();
    };
    const setActiveAge = (hash: string) => {
      for (const link of ageLinks) {
        const active = link.hash === hash;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveAge(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-15% 0px -55% 0px" },
    );
    for (const link of ageLinks) {
      const chapter = root.querySelector<HTMLElement>(link.hash);
      if (chapter) observer.observe(chapter);
    }

    const findAnchor = (hash: string) => {
      try {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        return target && root.contains(target) ? target : null;
      } catch {
        return null;
      }
    };
    const scrollToHash = (hash: string, smooth = false, focus = false) => {
      const target = findAnchor(hash);
      if (!target) return;
      target.scrollIntoView({ behavior: smooth && !reducedMotion.matches ? "smooth" : "instant", block: "start" });
      if (ageLinks.some((link) => link.hash === hash)) setActiveAge(hash);
      if (focus) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    };
    const syncHash = () => {
      window.cancelAnimationFrame(anchorFrame);
      anchorFrame = window.requestAnimationFrame(() => scrollToHash(window.location.hash));
    };
    const restoreFocus = () => {
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    };
    const onRootClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const artwork = event.target.closest<HTMLButtonElement>(".art-open");
      if (artwork && dialog && dialogImage && dialogTitle) {
        const { art, alt, title } = artwork.dataset;
        if (!art) return;
        previousFocus = artwork;
        dialogImage.src = art;
        dialogImage.alt = alt ?? "";
        dialogTitle.textContent = title ?? "Artwork";
        if (!dialog.open) dialog.showModal();
        closeButton?.focus();
        return;
      }
      const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const hash = anchor.getAttribute("href") ?? "";
      if (!findAnchor(hash)) return;
      event.preventDefault();
      if (window.location.hash !== hash) window.history.pushState(window.history.state, "", hash);
      scrollToHash(hash, true, true);
    };
    const closeArtwork = () => dialog?.close();
    const onDialogClick = (event: MouseEvent) => {
      if (event.target !== dialog || !dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        dialog.close();
      }
    };

    root.addEventListener("click", onRootClick);
    closeButton?.addEventListener("click", closeArtwork);
    dialog?.addEventListener("click", onDialogClick);
    dialog?.addEventListener("close", restoreFocus);
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", updateHeaderOffset);
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    const resizeObserver = new ResizeObserver(updateHeaderOffset);
    resizeObserver.observe(root);
    if (header) resizeObserver.observe(header);
    updateHeaderOffset();
    if (window.location.hash) syncHash();
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Font loading can shift an anchor after its first layout on a direct visit.
    void document.fonts.ready.then(() => {
      if (!disposed) syncHash();
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(anchorFrame);
      observer.disconnect();
      resizeObserver.disconnect();
      root.removeEventListener("click", onRootClick);
      closeButton?.removeEventListener("click", closeArtwork);
      dialog?.removeEventListener("click", onDialogClick);
      dialog?.removeEventListener("close", restoreFocus);
      if (dialog?.open) dialog.close();
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", updateHeaderOffset);
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
      root.style.removeProperty("--lore-header-offset");
      previousFocus = null;
    };
  }, []);

  return <div ref={rootRef} className="lore-chronicle" dangerouslySetInnerHTML={{ __html: chronicleHtml }} />;
}
