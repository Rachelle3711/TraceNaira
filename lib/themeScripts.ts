//Plain file (no "use client"), so the root layout can put this script in <head>
export const SETTINGS_KEY = 'tn_settings'

//Runs before the page paints (see layout.tsx), so darl mode never flashes white first
export const THEME_SCRIPT = `(function(){try{var t=(JSON.parse(localStorage.getItem('${SETTINGS_KEY}')||'{}').theme)||'light';var d=t==='dark||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()`