// One animated SVG scene per theme, drawn behind the conversation in the
// desktop and mobile apps. Each is built once, when the module loads.
// Subjects sit at the edges and the top: the words fill the middle and the
// message box the foot.

import { hsl, parseAuto } from './themes'

const W = 1600
const H = 1000

// A small seeded random, so each scene draws the same every time.
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (v: number): string => (Math.round(v * 10) / 10).toString()

function open(defs: string, style: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<defs>${defs}</defs><style>${style}</style>`
  )
}

function stars(rand: () => number, count: number, maxY: number, cls: string): string {
  let out = ''
  for (let i = 0; i < count; i += 1) {
    const x = rand() * W
    const y = rand() * maxY
    const r = 0.6 + rand() * 1.6
    const delay = -rand() * 6
    const dur = 2.5 + rand() * 4
    out += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" class="${cls}" style="animation-delay:${n(delay)}s;animation-duration:${n(dur)}s"/>`
  }
  return out
}

// A pine silhouette as path data: three stacked triangles and a trunk.
function pine(x: number, base: number, h: number, w: number): string {
  let d = `M${n(x - w * 0.06)} ${n(base)}h${n(w * 0.12)}v${n(-h * 0.12)}h${n(-w * 0.12)}z`
  for (let i = 0; i < 3; i += 1) {
    const bottom = base - h * 0.1 - i * h * 0.26
    const top = bottom - h * 0.42
    const half = (w / 2) * (1 - i * 0.22)
    d += `M${n(x - half)} ${n(bottom)}L${n(x)} ${n(top)}L${n(x + half)} ${n(bottom)}z`
  }
  return d
}

function lanterns(): string {
  const rand = seeded(7)
  const defs =
    '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080a21"/><stop offset=".55" stop-color="#1a1b46"/><stop offset="1" stop-color="#46294f"/></linearGradient>' +
    '<radialGradient id="glow"><stop offset="0" stop-color="#ffdb8f" stop-opacity=".95"/><stop offset=".3" stop-color="#f5a33c" stop-opacity=".4"/><stop offset="1" stop-color="#f5a33c" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="moon"><stop offset=".5" stop-color="#f6ecd0"/><stop offset=".58" stop-color="#f6ecd0" stop-opacity=".22"/><stop offset="1" stop-color="#f6ecd0" stop-opacity="0"/></radialGradient>' +
    '<g id="lan"><circle r="48" fill="url(#glow)"/><path d="M-9-12h18l-3 22h-12z" fill="#ffd27a"/><rect x="-7" y="-16" width="14" height="4" rx="1" fill="#6b3f1a"/></g>'
  const style =
    '.rise{animation:rise linear infinite}@keyframes rise{from{transform:translateY(0)}to{transform:translateY(-1250px)}}' +
    '.sway{animation:sway 5s ease-in-out infinite alternate}@keyframes sway{from{transform:translateX(-14px)}to{transform:translateX(14px)}}' +
    '.tw{fill:#fff;animation:tw ease-in-out infinite}@keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}' +
    '.fly{fill:#ffe9a6;animation:tw ease-in-out infinite}'

  let trees = ''
  for (let x = -20; x < 360; x += 46 + rand() * 30) {
    trees += pine(x, H + 10, 260 + rand() * 260, 120 + rand() * 60)
  }
  for (let x = 1240; x < W + 40; x += 46 + rand() * 30) {
    trees += pine(x, H + 10, 260 + rand() * 260, 120 + rand() * 60)
  }

  // Lanterns drift up the left and right thirds, never the middle.
  let lanterns = ''
  for (let i = 0; i < 16; i += 1) {
    const side = i % 2 === 0 ? rand() * 420 + 40 : W - 460 + rand() * 420
    const dur = 34 + rand() * 30
    const delay = -rand() * dur
    const scale = 0.55 + rand() * 0.6
    lanterns +=
      `<g transform="translate(${n(side)} 0)"><g class="rise" style="animation-duration:${n(dur)}s;animation-delay:${n(delay)}s">` +
      `<g class="sway" style="animation-delay:${n(-rand() * 5)}s"><use href="#lan" transform="translate(0 ${H + 80}) scale(${n(scale)})"/></g></g></g>`
  }

  let flies = ''
  for (let i = 0; i < 26; i += 1) {
    const x = i % 2 === 0 ? rand() * 380 : W - rand() * 380
    const y = 620 + rand() * 360
    flies += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(1.5 + rand() * 1.5)}" class="fly" style="animation-delay:${n(-rand() * 4)}s;animation-duration:${n(1.8 + rand() * 2.5)}s"/>`
  }

  return (
    open(defs, style) +
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>` +
    stars(rand, 110, 560, 'tw') +
    '<circle cx="1330" cy="170" r="150" fill="url(#moon)"/>' +
    `<path fill="#151231" d="M0 ${H}V760Q300 690 620 760T1600 730V${H}z"/>` +
    lanterns +
    `<path fill="#07071a" d="${trees}"/>` +
    flies +
    '</svg>'
  )
}

function space(): string {
  const rand = seeded(11)
  const defs =
    '<radialGradient id="space" cx=".3" cy=".25" r="1"><stop offset="0" stop-color="#121a38"/><stop offset=".6" stop-color="#090d1d"/><stop offset="1" stop-color="#04060d"/></radialGradient>' +
    '<radialGradient id="neb1"><stop offset="0" stop-color="#5b3fd1" stop-opacity=".35"/><stop offset="1" stop-color="#5b3fd1" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="neb2"><stop offset="0" stop-color="#1fb5c9" stop-opacity=".25"/><stop offset="1" stop-color="#1fb5c9" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="planet" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9fd2ff"/><stop offset=".45" stop-color="#3f8ff0"/><stop offset="1" stop-color="#13265e"/></radialGradient>' +
    '<radialGradient id="mars" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffd0a0"/><stop offset=".5" stop-color="#e5793d"/><stop offset="1" stop-color="#5a2412"/></radialGradient>' +
    '<linearGradient id="tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bfe6ff" stop-opacity="0"/><stop offset="1" stop-color="#e9f6ff" stop-opacity=".9"/></linearGradient>'
  const style =
    '.tw{fill:#e7f0ff;animation:tw ease-in-out infinite}@keyframes tw{0%,100%{opacity:.2}50%{opacity:1}}' +
    '.comet{animation:comet 26s linear infinite}@keyframes comet{0%{transform:translate(-300px,40px);opacity:0}4%{opacity:1}22%{transform:translate(1900px,420px);opacity:0}100%{transform:translate(1900px,420px);opacity:0}}'

  const ring = (rx: number, tilt: number, flat: number, dur: number, moonR: number, color: string, start: number): string =>
    `<g transform="rotate(${tilt}) scale(1 ${flat})">` +
    `<ellipse rx="${rx}" ry="${rx}" fill="none" stroke="#7fb8ff" stroke-opacity=".28" stroke-width="1.4" vector-effect="non-scaling-stroke"/>` +
    `<g><animateTransform attributeName="transform" type="rotate" from="${start} 0 0" to="${start + 360} 0 0" dur="${dur}s" repeatCount="indefinite"/>` +
    `<circle cx="${rx}" cy="0" r="${moonR}" fill="${color}"/></g></g>`

  return (
    open(defs, style) +
    `<rect width="${W}" height="${H}" fill="url(#space)"/>` +
    '<ellipse cx="1250" cy="760" rx="520" ry="300" fill="url(#neb1)"/>' +
    '<ellipse cx="380" cy="820" rx="420" ry="240" fill="url(#neb2)"/>' +
    stars(rand, 170, H, 'tw') +
    '<g transform="translate(250 230)">' +
    ring(250, -16, 0.36, 40, 9, '#d7e6ff', 30) +
    ring(175, -16, 0.36, 22, 6, '#ffe6b0', 200) +
    '<circle r="78" fill="url(#planet)"/>' +
    '<g transform="rotate(-16) scale(1 .28)"><ellipse rx="128" ry="128" fill="none" stroke="#bfe0ff" stroke-opacity=".55" stroke-width="7" vector-effect="non-scaling-stroke"/></g>' +
    ring(330, -16, 0.36, 70, 12, '#9ad7c8', 120) +
    '</g>' +
    '<g transform="translate(1390 190)">' +
    '<circle r="30" fill="url(#mars)"/>' +
    ring(70, 24, 0.5, 14, 4, '#e8eefc', 0) +
    '</g>' +
    '<g class="comet"><path d="M-160 -6L0 0L-160 6z" fill="url(#tail)"/><circle r="4" fill="#ffffff"/></g>' +
    '</svg>'
  )
}

function alchemy(): string {
  const rand = seeded(23)
  const defs =
    '<linearGradient id="lab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06120d"/><stop offset=".6" stop-color="#0d2219"/><stop offset="1" stop-color="#17321f"/></linearGradient>' +
    '<radialGradient id="brew" cx=".5" cy=".6"><stop offset="0" stop-color="#9dffb6"/><stop offset=".55" stop-color="#2fc77a"/><stop offset="1" stop-color="#0e6b3b"/></radialGradient>' +
    '<radialGradient id="aura"><stop offset="0" stop-color="#5dff9e" stop-opacity=".35"/><stop offset="1" stop-color="#5dff9e" stop-opacity="0"/></radialGradient>'
  const style =
    '.tile{fill:#d9c78f;fill-opacity:.05;stroke:#d9c78f;stroke-opacity:.18}' +
    '.sym{fill:#e8d9a8;fill-opacity:.32;font:600 22px Georgia,serif;text-anchor:middle}' +
    '.num{fill:#e8d9a8;fill-opacity:.22;font:10px sans-serif}' +
    '.lit{animation:lit ease-in-out infinite}@keyframes lit{0%,100%{fill-opacity:.05}50%{fill-opacity:.32}}' +
    '.bub{fill:#b8ffd0;animation:bub linear infinite}@keyframes bub{0%{transform:translateY(0);opacity:0}10%{opacity:.85}100%{transform:translateY(-420px);opacity:0}}' +
    '.drift{animation:drift ease-in-out infinite alternate}@keyframes drift{from{transform:translateY(-10px)}to{transform:translateY(12px)}}' +
    '.fx{fill:#cdeccf;fill-opacity:.2;font:italic 34px Georgia,serif}'

  // The first rows of a periodic table across the top.
  const table: [string, number, number][] = [
    ['H', 0, 1], ['He', 17, 2],
    ['Li', 0, 3], ['Be', 1, 4], ['B', 12, 5], ['C', 13, 6], ['N', 14, 7], ['O', 15, 8], ['F', 16, 9], ['Ne', 17, 10],
    ['Na', 0, 11], ['Mg', 1, 12], ['Al', 12, 13], ['Si', 13, 14], ['P', 14, 15], ['S', 15, 16], ['Cl', 16, 17], ['Ar', 17, 18],
    ['K', 0, 19], ['Ca', 1, 20], ['Fe', 7, 26], ['Cu', 10, 29], ['Zn', 11, 30], ['Br', 16, 35],
  ]
  const rowOf = (z: number): number => (z <= 2 ? 0 : z <= 10 ? 1 : z <= 18 ? 2 : 3)
  const size = 62
  const left = (W - 18 * (size + 8)) / 2
  let tiles = ''
  for (const [sym, col, z] of table) {
    const x = left + col * (size + 8)
    const y = 26 + rowOf(z) * (size + 8)
    const glow = rand() < 0.4 ? ` lit" style="animation-duration:${n(4 + rand() * 6)}s;animation-delay:${n(-rand() * 8)}s` : ''
    tiles +=
      `<rect x="${n(x)}" y="${n(y)}" width="${size}" height="${size}" rx="6" class="tile${glow}"/>` +
      `<text x="${n(x + 6)}" y="${n(y + 14)}" class="num">${z}</text>` +
      `<text x="${n(x + size / 2)}" y="${n(y + 43)}" class="sym">${sym}</text>`
  }

  let bubbles = ''
  for (let i = 0; i < 14; i += 1) {
    const x = 1408 + (rand() - 0.5) * 70
    const dur = 3 + rand() * 4
    bubbles += `<circle cx="${n(x)}" cy="700" r="${n(3 + rand() * 6)}" class="bub" style="animation-duration:${n(dur)}s;animation-delay:${n(-rand() * dur)}s"/>`
  }

  const formulas: [string, number, number][] = [
    ['H₂O', 110, 420], ['NaCl', 190, 560], ['CO₂', 80, 690], ['Fe₂O₃', 230, 790],
  ]
  let fx = ''
  for (const [f, x, y] of formulas) {
    fx += `<g class="drift" style="animation-duration:${n(5 + rand() * 4)}s;animation-delay:${n(-rand() * 5)}s"><text x="${x}" y="${y}" class="fx">${f}</text></g>`
  }

  return (
    open(defs, style) +
    `<rect width="${W}" height="${H}" fill="url(#lab)"/>` +
    tiles +
    fx +
    // A benzene ring, drawn faint on the left.
    '<g transform="translate(300 330)" fill="none" stroke="#cdeccf" stroke-opacity=".16" stroke-width="3"><path d="M0-60L52-30V30L0 60L-52 30V-30z"/><circle r="34"/></g>' +
    // The flask, lower right.
    '<circle cx="1410" cy="800" r="200" fill="url(#aura)"/>' +
    '<g transform="translate(1410 0)">' +
    '<path d="M-24 610V700A105 105 0 1 0 24 700V610z" fill="#cfe9dc" fill-opacity=".08" stroke="#cfe9dc" stroke-opacity=".55" stroke-width="4"/>' +
    '<path d="M-96 770A100 100 0 0 0 96 770z" fill="url(#brew)" fill-opacity=".85"/>' +
    '<rect x="-32" y="598" width="64" height="14" rx="5" fill="#8a6a3a"/>' +
    '</g>' +
    bubbles +
    '</svg>'
  )
}

function paper(): string {
  const rand = seeded(5)
  const defs =
    '<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1e16"/><stop offset=".7" stop-color="#3a2a1f"/><stop offset="1" stop-color="#4a3626"/></linearGradient>' +
    '<radialGradient id="flame"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#ffbe55" stop-opacity=".8"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="pool"><stop offset="0" stop-color="#ffb860" stop-opacity=".28"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>' +
    '<pattern id="stripe" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="40" fill="#ffffff" fill-opacity=".018"/></pattern>'
  const style =
    '.draw{fill:none;stroke:#d8c7a4;stroke-opacity:.45;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1400;animation:draw 14s ease-in-out infinite}' +
    '@keyframes draw{0%{stroke-dashoffset:1400;opacity:1}55%{stroke-dashoffset:0;opacity:1}85%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}' +
    '.flick{animation:flick .9s ease-in-out infinite alternate}@keyframes flick{from{opacity:.75}to{opacity:1}}' +
    '.dust{fill:#ffe2b0;animation:dust linear infinite}@keyframes dust{0%{transform:translateY(0);opacity:0}20%{opacity:.5}100%{transform:translateY(-260px);opacity:0}}'

  const frame = (x: number, y: number, w: number, h: number, sketch: string, delay: number): string =>
    `<rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" fill="#3a2b1e" stroke="#6e5530" stroke-width="4"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#4a3a2b"/>` +
    `<path class="draw" style="animation-delay:${delay}s" d="${sketch}"/>`

  // Pencil sketches drawn line by line: a hill and sun, and a paper rabbit.
  const hill = 'M100 290Q170 200 250 250T400 230M100 300Q220 260 400 290M330 150A34 34 0 1 1 330.1 150M250 120L262 98M220 135L205 118'
  const bunny = 'M1310 330Q1300 270 1350 260Q1395 255 1400 300Q1440 300 1440 340Q1440 372 1400 372H1320Q1290 372 1295 345M1360 262L1352 190Q1364 180 1372 192L1378 258M1336 300A4 4 0 1 1 1336.1 300'

  let dust = ''
  for (let i = 0; i < 16; i += 1) {
    const x = 120 + rand() * 260
    const dur = 6 + rand() * 6
    dust += `<circle cx="${n(x)}" cy="${n(820 + rand() * 100)}" r="${n(1 + rand() * 1.8)}" class="dust" style="animation-duration:${n(dur)}s;animation-delay:${n(-rand() * dur)}s"/>`
  }

  // A folded-paper rabbit with a candle flame on its raised ear.
  const rabbit =
    '<g transform="translate(200 880) scale(1.2)">' +
    '<ellipse cx="0" cy="44" rx="110" ry="16" fill="#000" fill-opacity=".25"/>' +
    '<polygon points="-62,40 -70,0 -40,-34 18,-36 50,-6 46,40" fill="#b8a885" stroke="#8a7a5a" stroke-width="2"/>' +
    '<polygon points="-40,-34 -10,-6 18,-36" fill="#a49473"/>' +
    '<polygon points="30,-30 66,-62 98,-38 86,0 50,-6" fill="#c2b28f" stroke="#8a7a5a" stroke-width="2"/>' +
    '<polygon points="56,-58 52,-150 72,-152 76,-60" fill="#c2b28f" stroke="#8a7a5a" stroke-width="2"/>' +
    '<polygon points="84,-40 128,-30 124,-18 88,-26" fill="#ad9d7c" stroke="#8a7a5a" stroke-width="2"/>' +
    '<circle cx="80" cy="-34" r="3.5" fill="#3b3328"/>' +
    '<circle cx="62" cy="-176" r="70" fill="url(#pool)"/>' +
    '<g class="flick"><ellipse cx="62" cy="-168" rx="9" ry="17" fill="url(#flame)"/><ellipse cx="62" cy="-163" rx="3.5" ry="7" fill="#fffbe8"/></g>' +
    '</g>'

  return (
    open(defs, style) +
    `<rect width="${W}" height="${H}" fill="url(#wall)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#stripe)"/>` +
    `<rect y="${H - 120}" width="${W}" height="120" fill="#24190f"/>` +
    frame(80, 80, 340, 260, hill, 0) +
    frame(1270, 230, 210, 190, bunny, 3) +
    rabbit +
    dust +
    '</svg>'
  )
}

function aurora(): string {
  const rand = seeded(31)
  const defs =
    '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>' +
    '<g id="spark"><path d="M0-10L2.4-2.4L10 0L2.4 2.4L0 10L-2.4 2.4L-10 0L-2.4-2.4z"/></g>'
  const style =
    '.a{animation:a 26s ease-in-out infinite alternate}@keyframes a{from{transform:translate(-80px,-40px)}to{transform:translate(120px,90px)}}' +
    '.b{animation:b 31s ease-in-out infinite alternate}@keyframes b{from{transform:translate(90px,60px)}to{transform:translate(-110px,-70px)}}' +
    '.c{animation:c 37s ease-in-out infinite alternate}@keyframes c{from{transform:translate(-60px,80px)}to{transform:translate(70px,-90px)}}' +
    '.sp{animation:sp ease-in-out infinite}@keyframes sp{0%,100%{opacity:0}50%{opacity:.9}}'

  let sparks = ''
  for (let i = 0; i < 30; i += 1) {
    const x = rand() < 0.5 ? rand() * 420 : W - rand() * 420
    const y = rand() * H * 0.85
    const color = rand() < 0.5 ? '#44eedd' : '#ffd866'
    const s = 0.5 + rand() * 1.1
    sparks += `<use href="#spark" fill="${color}" class="sp" transform="translate(${n(x)} ${n(y)}) scale(${n(s)})" style="animation-duration:${n(3 + rand() * 4)}s;animation-delay:${n(-rand() * 6)}s"/>`
  }

  return (
    open(defs, style) +
    `<rect width="${W}" height="${H}" fill="#0e0a1f"/>` +
    '<g filter="url(#soft)" opacity=".75">' +
    '<g class="a"><circle cx="260" cy="260" r="260" fill="#5588ff"/></g>' +
    '<g class="b"><circle cx="1360" cy="300" r="250" fill="#ff5599"/></g>' +
    '<g class="c"><circle cx="1080" cy="820" r="280" fill="#aa66ee"/></g>' +
    '<g class="a"><circle cx="420" cy="860" r="200" fill="#44eedd" fill-opacity=".45"/></g>' +
    '</g>' +
    sparks +
    '</svg>'
  )
}

function music(): string {
  const rand = seeded(41)
  const defs =
    '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#110e24"/><stop offset=".6" stop-color="#1f1638"/><stop offset="1" stop-color="#2c1b40"/></linearGradient>' +
    '<radialGradient id="lamp"><stop offset="0" stop-color="#f3d38a" stop-opacity=".35"/><stop offset="1" stop-color="#f3d38a" stop-opacity="0"/></radialGradient>' +
    '<g id="note"><ellipse rx="12" ry="8.5" transform="rotate(-22)"/><rect x="9.5" y="-50" width="3" height="50"/></g>' +
    '<g id="pair"><ellipse rx="12" ry="8.5" transform="rotate(-22)"/><rect x="9.5" y="-50" width="3" height="50"/><ellipse cx="48" cy="-10" rx="12" ry="8.5" transform="rotate(-22 48 -10)"/><rect x="57.5" y="-60" width="3" height="50"/><path d="M9.5-50L60.5-60V-52L9.5-42z"/></g>'
  const style =
    '.flow{animation:flow linear infinite}@keyframes flow{from{transform:translateX(0)}to{transform:translateX(-2000px)}}' +
    '.staff{fill:none;stroke:#e8c77a;stroke-opacity:.22;stroke-width:2}' +
    '.nt{fill:#f2dca6;fill-opacity:.6}'

  // Two staves, gently curved: one high, one low.
  const staff = (y: number, bend: number): string => {
    let d = ''
    for (let i = 0; i < 5; i += 1) {
      const yy = y + i * 18
      d += `M-20 ${yy}C500 ${yy - bend} 1100 ${yy + bend} 1620 ${yy}`
    }
    return `<path class="staff" d="${d}"/>`
  }

  // Notes flow right to left along each staff, the strip repeating every 2000px.
  const notes = (y: number, seed: number): string => {
    let out = ''
    let x = 0
    const r = seeded(seed)
    while (x < 2000) {
      const line = Math.floor(r() * 9) * 9
      const use = r() < 0.3 ? 'pair' : 'note'
      out += `<use href="#${use}" class="nt" x="${n(x)}" y="${n(y + line)}"/><use href="#${use}" class="nt" x="${n(x + 2000)}" y="${n(y + line)}"/>`
      x += 110 + r() * 160
    }
    return out
  }

  let specks = ''
  for (let i = 0; i < 40; i += 1) {
    specks += `<circle cx="${n(rand() * W)}" cy="${n(rand() * H)}" r="${n(0.6 + rand() * 1.4)}" fill="#f2dca6" fill-opacity=".25"/>`
  }

  return (
    open(defs, style) +
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    specks +
    staff(170, 40) +
    staff(780, -40) +
    `<g class="flow" style="animation-duration:70s">${notes(170, 3)}</g>` +
    `<g class="flow" style="animation-duration:95s">${notes(780, 9)}</g>` +
    // A metronome, upper right, keeping a slow beat.
    '<circle cx="1420" cy="300" r="190" fill="url(#lamp)"/>' +
    '<g transform="translate(1420 400)">' +
    '<path d="M-70 0L-34-240H34L70 0z" fill="#3a2a52" stroke="#c9a96a" stroke-opacity=".6" stroke-width="3"/>' +
    '<g><animateTransform attributeName="transform" type="rotate" values="-24 0 -20;24 0 -20;-24 0 -20" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>' +
    '<rect x="-2.5" y="-230" width="5" height="210" fill="#e8c77a"/><rect x="-11" y="-170" width="22" height="16" rx="3" fill="#f2dca6"/></g>' +
    '<rect x="-80" y="0" width="160" height="16" rx="4" fill="#2a1e3c"/>' +
    '</g>' +
    '</svg>'
  )
}

function dawn(): string {
  const rand = seeded(53)
  const defs =
    '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1430"/><stop offset=".55" stop-color="#4a2244"/><stop offset="1" stop-color="#b65a5e"/></linearGradient>' +
    '<radialGradient id="sun"><stop offset="0" stop-color="#ffd3a1"/><stop offset=".45" stop-color="#ff9f80" stop-opacity=".55"/><stop offset="1" stop-color="#ff9f80" stop-opacity="0"/></radialGradient>' +
    '<path id="drop" d="M0-14C6-4 9 1 9 5A9 9 0 0 1-9 5C-9 1-6-4 0-14z"/>'
  const style =
    '.ring{fill:none;stroke-linecap:round;animation:ring 9s ease-in-out infinite}' +
    '@keyframes ring{0%{stroke-dashoffset:var(--c)}60%,85%{stroke-dashoffset:var(--f)}100%{stroke-dashoffset:var(--c)}}' +
    '.beat{fill:none;stroke:#ffb3b8;stroke-width:3;stroke-linejoin:round;stroke-dasharray:900;animation:beat 5s linear infinite}' +
    '@keyframes beat{0%{stroke-dashoffset:900;opacity:.9}70%{stroke-dashoffset:0;opacity:.9}100%{stroke-dashoffset:0;opacity:0}}' +
    '.up{fill:#bfe6f2;animation:up linear infinite}@keyframes up{0%{transform:translateY(0);opacity:0}15%{opacity:.6}100%{transform:translateY(-520px);opacity:0}}'

  // Activity rings, upper right, filling and emptying slowly.
  const ring = (r: number, color: string, fill: number, delay: number): string => {
    const c = 2 * Math.PI * r
    return (
      `<circle r="${r}" fill="none" stroke="${color}" stroke-opacity=".18" stroke-width="16"/>` +
      `<circle r="${r}" class="ring" stroke="${color}" stroke-width="16" stroke-dasharray="${n(c)}" ` +
      `style="--c:${n(c)};--f:${n(c * (1 - fill))};animation-delay:${delay}s" transform="rotate(-90)"/>`
    )
  }

  let drops = ''
  for (let i = 0; i < 14; i += 1) {
    const x = 60 + rand() * 330
    const dur = 9 + rand() * 8
    drops += `<g transform="translate(${n(x)} ${n(900 + rand() * 80)}) scale(${n(0.6 + rand() * 0.7)})"><use href="#drop" class="up" style="animation-duration:${n(dur)}s;animation-delay:${n(-rand() * dur)}s"/></g>`
  }

  let specks = ''
  for (let i = 0; i < 45; i += 1) {
    specks += `<circle cx="${n(rand() * W)}" cy="${n(rand() * 450)}" r="${n(0.6 + rand() * 1.4)}" fill="#fff" fill-opacity=".35"/>`
  }

  const pulse = 'M1100 860H1250L1268 830L1290 900L1312 770L1336 880L1352 860H1600'

  return (
    open(defs, style) +
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    specks +
    '<circle cx="250" cy="1010" r="260" fill="url(#sun)"/>' +
    `<g transform="translate(1380 230)">${ring(120, '#ff6b8b', 0.78, 0)}${ring(92, '#ffb27a', 0.62, 0.6)}${ring(64, '#6fd3c7', 0.9, 1.2)}</g>` +
    `<path class="beat" d="${pulse}"/>` +
    drops +
    '</svg>'
  )
}

function studio(): string {
  const rand = seeded(67)
  const defs =
    '<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1c26"/><stop offset="1" stop-color="#1b3140"/></linearGradient>' +
    '<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e2a1b"/><stop offset="1" stop-color="#6b4a2e"/></linearGradient>' +
    '<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="spot" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff1d0" stop-opacity=".35"/><stop offset="1" stop-color="#fff1d0" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="mirrors"><rect x="30" y="120" width="360" height="580"/><rect x="1210" y="120" width="360" height="580"/></clipPath>'
  const style =
    '.sh{animation:sh 11s ease-in-out infinite}@keyframes sh{0%{transform:translateX(-500px)}60%,100%{transform:translateX(1900px)}}' +
    '.mote{fill:#ffe9c2;animation:mote linear infinite}@keyframes mote{0%{transform:translateY(0);opacity:0}25%{opacity:.5}100%{transform:translateY(-300px);opacity:0}}'

  // Floor planks converging toward the middle of the room.
  let planks = ''
  for (let x = -1600; x <= 3200; x += 120) {
    planks += `M${x} ${H}L${n(800 + (x - 800) * 0.38)} 760`
  }

  let motes = ''
  for (let i = 0; i < 18; i += 1) {
    const x = i % 2 === 0 ? 120 + rand() * 260 : 1220 + rand() * 260
    const dur = 8 + rand() * 7
    motes += `<circle cx="${n(x)}" cy="${n(560 + rand() * 180)}" r="${n(1 + rand() * 1.8)}" class="mote" style="animation-duration:${n(dur)}s;animation-delay:${n(-rand() * dur)}s"/>`
  }

  const cone = (x: number, from: number, to: number, dur: number): string =>
    `<g transform="translate(${x} -20)"><g><animateTransform attributeName="transform" type="rotate" values="${from};${to};${from}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>` +
    '<path d="M-14 0L14 0L210 980L-210 980z" fill="url(#spot)"/></g></g>'

  return (
    open(defs, style) +
    `<rect width="${W}" height="${H}" fill="url(#wall)"/>` +
    // Mirrors on both sides, a sheen passing across them.
    '<rect x="30" y="120" width="360" height="580" fill="#9fc3d6" fill-opacity=".06" stroke="#9fc3d6" stroke-opacity=".25" stroke-width="3"/>' +
    '<rect x="1210" y="120" width="360" height="580" fill="#9fc3d6" fill-opacity=".06" stroke="#9fc3d6" stroke-opacity=".25" stroke-width="3"/>' +
    '<g clip-path="url(#mirrors)"><g class="sh"><rect x="0" y="0" width="240" height="1000" fill="url(#sheen)" transform="skewX(-20)"/></g></g>' +
    // The barre across the room.
    `<path d="M0 560H${W}" stroke="#c9a46a" stroke-width="7" stroke-linecap="round"/>` +
    '<path d="M120 560V700M480 560V700M1120 560V700M1480 560V700" stroke="#8e7349" stroke-width="5"/>' +
    `<rect y="760" width="${W}" height="${H - 760}" fill="url(#floor)"/>` +
    `<path d="${planks}" stroke="#2a1b10" stroke-opacity=".5" stroke-width="2"/>` +
    `<path d="M0 760H${W}" stroke="#1a120b" stroke-width="4"/>` +
    cone(260, -14, 10, 13) +
    cone(1340, 12, -10, 15) +
    motes +
    '</svg>'
  )
}

// A veil over the whole scene, so it stays in the background: a light wash
// when the app is in light mode, a dim when it's dark.
const veil = (dark: number, light: number): string =>
  `<style>.veil{fill:#05060c;opacity:${dark}}@media (prefers-color-scheme: light){.veil{fill:#f3f4f7;opacity:${light}}}</style>` +
  `<rect class="veil" width="${W}" height="${H}"/>`

// Hand-made scenes have pictures to read, so they sit under a heavy veil.
const soften = (svg: string, dark = 0.8, light = 0.84): string =>
  svg.replace(/<\/svg>$/, `${veil(dark, light)}</svg>`)

// The hand-made scenes as drawn, before any veil.
const RAW: Record<string, string> = {
  paper: paper(),
  lanterns: lanterns(),
  alchemy: alchemy(),
  space: space(),
  aurora: aurora(),
  music: music(),
  dawn: dawn(),
  studio: studio(),
}

// ---- Automatic looks ----------------------------------------------------

// A quiet scene in one hue for a project with no hand-made theme. The pattern
// and hue come from the project's name (see themes.ts), so a project always
// gets the same one.
function auto(hue: number, pattern: number): string {
  const rand = seeded(hue * 7 + pattern + 1)
  const deep = hsl(hue, 0.5, 0.16)
  const mid = hsl((hue + 30) % 360, 0.55, 0.28)
  const glow = hsl(hue, 0.7, 0.6)
  const glow2 = hsl((hue + 40) % 360, 0.7, 0.62)
  const defs =
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${deep}"/><stop offset="1" stop-color="${mid}"/></linearGradient>` +
    '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>'
  const style =
    '.dr{animation:dr 30s ease-in-out infinite alternate}@keyframes dr{from{transform:translate(-90px,-50px)}to{transform:translate(110px,80px)}}' +
    '.dr2{animation:dr2 37s ease-in-out infinite alternate}@keyframes dr2{from{transform:translate(80px,70px)}to{transform:translate(-100px,-60px)}}' +
    '.wv{animation:wv linear infinite}@keyframes wv{from{transform:translateX(0)}to{transform:translateX(-400px)}}' +
    '.pu{animation:pu ease-in-out infinite}@keyframes pu{0%,100%{opacity:.12}50%{opacity:.75}}'
  let body = ''

  if (pattern === 0) {
    // Aurora: two soft glows drifting in the corners.
    body =
      '<g filter="url(#soft)" opacity=".8">' +
      `<g class="dr"><circle cx="220" cy="260" r="280" fill="${glow}"/></g>` +
      `<g class="dr2"><circle cx="1380" cy="760" r="300" fill="${glow2}"/></g>` +
      `<g class="dr2"><circle cx="1420" cy="160" r="160" fill="${glow}" fill-opacity=".6"/></g>` +
      '</g>'
  } else if (pattern === 1) {
    // Waves: layered swells along the top and the foot, rolling sideways.
    const wave = (y: number, amp: number): string => {
      let d = `M0 ${y}Q100 ${y - amp} 200 ${y}`
      for (let x = 400; x <= W * 2 + 400; x += 200) {
        d += `T${x} ${y}`
      }
      return d
    }
    for (let i = 0; i < 4; i += 1) {
      const y = 760 + i * 60
      const dur = 14 + i * 6
      body += `<g class="wv" style="animation-duration:${dur}s"><path d="${wave(y, 40 - i * 6)}V${H}H0z" fill="${i % 2 === 0 ? glow : glow2}" fill-opacity="${n(0.1 + i * 0.05)}"/></g>`
    }
    for (let i = 0; i < 2; i += 1) {
      const y = 120 - i * 50
      body += `<g class="wv" style="animation-duration:${22 + i * 8}s;animation-direction:reverse"><path d="${wave(y, 30)}V0H0z" fill="${glow2}" fill-opacity="${n(0.08 + i * 0.05)}"/></g>`
    }
  } else if (pattern === 2) {
    // Dot fields on both sides, pulsing in slow ripples.
    for (const [x0, x1] of [[40, 420], [1180, 1560]] as const) {
      for (let x = x0; x <= x1; x += 38) {
        for (let y = 40; y <= H - 40; y += 38) {
          const away = Math.hypot(x - (x0 + x1) / 2, y - H / 2)
          body += `<circle cx="${x}" cy="${y}" r="3.4" fill="${rand() < 0.15 ? glow2 : glow}" class="pu" style="animation-duration:6s;animation-delay:${n(-away / 90)}s"/>`
        }
      }
    }
  } else {
    // Rings: slow dashed orbits from two corners.
    const corner = (cx: number, cy: number, color: string, turn: number): string => {
      let rings = ''
      for (let r = 120; r <= 620; r += 70) {
        const dur = 60 + r / 4
        rings +=
          `<g transform="translate(${cx} ${cy})"><g>` +
          `<animateTransform attributeName="transform" type="rotate" from="0 0 0" to="${turn * 360} 0 0" dur="${n(dur)}s" repeatCount="indefinite"/>` +
          `<circle r="${r}" fill="none" stroke="${color}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="${n(8 + rand() * 30)} ${n(10 + rand() * 40)}"/>` +
          '</g></g>'
      }
      return rings
    }
    body = corner(0, H, glow, 1) + corner(W, 0, glow2, -1)
  }

  return open(defs, style) + `<rect width="${W}" height="${H}" fill="url(#bg)"/>` + body + '</svg>'
}

const autoCache = new Map<string, string>()

// A theme id's scene as drawn, hand-made or automatic (`auto-<hue>-<pattern>`).
function rawFor(id: string): string | undefined {
  const made = RAW[id]
  if (made !== undefined) {
    return made
  }
  const parsed = parseAuto(id)
  if (parsed === undefined) {
    return undefined
  }
  let scene = autoCache.get(id)
  if (scene === undefined) {
    scene = auto(parsed.hue, parsed.pattern)
    autoCache.set(id, scene)
  }
  return scene
}

/**
 * The backdrop behind the chat: faint. A hand-made scene sits under a heavy veil;
 * an automatic look's color is its only identity, so its veil is lighter.
 */
export function sceneFor(id: string): string | undefined {
  const raw = rawFor(id)
  if (raw === undefined) {
    return undefined
  }
  return RAW[id] !== undefined ? soften(raw) : soften(raw, 0.55, 0.6)
}

/** The postcard in the Look pane: small, so it shows the scene nearly as drawn. */
export function postcardFor(id: string): string | undefined {
  const raw = rawFor(id)
  return raw === undefined ? undefined : soften(raw, 0.15, 0.2)
}
