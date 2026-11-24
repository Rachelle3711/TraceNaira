// One-time script: turns the fixed colours in app/globals.css into theme variables,
// so dark mode can swap them. Safe to run once. Run from the project folder:
//   node scripts/theme-colors.mjs
import fs from 'node:fs'

const file = 'app/globals.css'
let css = fs.readFileSync(file, 'utf8')
if (css.includes('--on-ink:')) {
  console.log('Already done, nothing changed.')
  process.exit(0)
}

// 1) Page backgrounds become --page, every other white background becomes --card
const PAGES = ['.wl{', '.pg{', '.rp{', '.tk{', '.au{', '.gs-gate{']
css = css
  .split('\n')
  .map((line) => {
    if (PAGES.some((p) => line.startsWith(p))) line = line.replace('background:#fff', 'background:var(--page)')
    return line.replace(/background:#fff(?![0-9a-fA-F])/g, 'background:var(--card)')
  })
  .join('\n')

// 2) Greys and tints become variables (same colours in light mode)
const MAP = {
  '#E8E3D8': 'var(--edge)', '#F3F0E9': 'var(--soft)', '#D6CFBD': 'var(--edge3)', '#F0ECE3': 'var(--edge2)',
  '#EEE9DE': 'var(--edge2)', '#E4DED1': 'var(--edge4)', '#E4DED0': 'var(--edge4)', '#8A857A': 'var(--mut2)',
  '#6E695D': 'var(--mut3)', '#7A7568': 'var(--mut3)', '#A39E92': 'var(--mut4)', '#C9C4B8': 'var(--disabled)',
  '#F1F8F4': 'var(--mint)', '#BFE0CC': 'var(--mint-edge)', '#1D4A32': 'var(--mint-fg)', '#E6F2EB': 'var(--mint2)',
  '#FAF8F3': 'var(--soft2)', '#FBF8F1': 'var(--soft2)', '#F8E1DE': 'var(--red-bg)', '#FDF1EF': 'var(--red-bg2)',
  '#FFFBFA': 'var(--red-bg2)', '#7A2318': 'var(--red-fg)', '#F3DFB4': 'var(--amber-bg)', '#5A3D05': 'var(--amber-fg)',
  '#E9E6DE': 'var(--desk)',
}
for (const [hex, v] of Object.entries(MAP)) css = css.replace(new RegExp(hex + '(?![0-9a-fA-F])', 'gi'), v)

// 3) White text on dark-green fills follows the theme (dark text on light fills in dark mode)
for (const sel of ['.wl-btn{', '.rpt-btn{', '.rp-tile.on .rp-tile-ic{', '.tk-btn{', '.tk-step.on .tk-num{', '.hs-filters button.on{']) {
  const i = css.indexOf('\n' + sel) + 1
  if (i === 0) { console.log('Not found, skipped:', sel); continue }
  const j = css.indexOf('}', i)
  css = css.slice(0, i) + css.slice(i, j).replace('color:#fff', 'color:var(--on-ink)') + css.slice(j)
}

// 4) The light values, added right after the first line
const ROOT =
  ':root{--page:#fff;--card:#fff;--edge:#E8E3D8;--edge2:#F0ECE3;--edge3:#D6CFBD;--edge4:#E4DED1;--soft:#F3F0E9;--soft2:#FAF8F3;' +
  '--mut2:#8A857A;--mut3:#6E695D;--mut4:#A39E92;--disabled:#C9C4B8;--mint:#F1F8F4;--mint2:#E6F2EB;--mint-edge:#BFE0CC;--mint-fg:#1D4A32;' +
  '--red-bg:#F8E1DE;--red-bg2:#FDF1EF;--red-fg:#7A2318;--amber-bg:#F3DFB4;--amber-fg:#5A3D05;--desk:#E9E6DE;--on-ink:#fff;color-scheme:light}'
const nl = css.indexOf('\n')
css = css.slice(0, nl + 1) + ROOT + '\n' + css.slice(nl + 1)

fs.writeFileSync(file, css)
console.log('Done: colours in app/globals.css now follow light and dark mode.')