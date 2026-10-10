export const THEME_STORAGE_KEY = "theme";

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Dark unless the visitor chose light; mirrors `applyTheme` in `use-theme.ts`.
 * `data-theme-pref` drives the toggle's icon (CSS), so it's right before hydration.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}")==="light"?"light":"dark";var r=document.documentElement;r.classList.add("js");r.classList.toggle("dark",t==="dark");r.dataset.themePref=t;r.style.colorScheme=t}catch(e){}})()`;
