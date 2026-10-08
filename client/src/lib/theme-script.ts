export const THEME_STORAGE_KEY = "theme";

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Kept dependency-free and tiny; mirrors `applyTheme` in `use-theme.ts`.
 * `data-theme-pref` holds the chosen mode (system/light/dark) for the toggle icon (CSS-driven).
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.dataset.themePref=t;r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
