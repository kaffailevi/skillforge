// Shared by the root layout (server) and the theme store (browser), so it must not import React.
export const THEME_KEY = "skillforge.theme";

// Runs in <head> before the first paint, so a saved dark theme never flashes light.
export const THEME_SCRIPT = `(function(){try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_KEY)}));if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
