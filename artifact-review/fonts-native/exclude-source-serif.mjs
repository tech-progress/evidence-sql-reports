// Proposed pre-build substitution for Evidence 0.10.1 at
// 474ef4564f00e84991a055a3196fb32fd9d8d63a. MIT: recipe-LICENSE.txt.
// --check only reads. --apply changes the disposable upstream build tree.
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const [mode, inputRoot, ...extra] = process.argv.slice(2);
if (!['--check', '--apply'].includes(mode) || !inputRoot || extra.length) {
  throw new Error('Usage: node exclude-source-serif.mjs --check|--apply UPSTREAM_ROOT');
}
const root = resolve(inputRoot);
const digest = (data) => createHash('sha256').update(data).digest('hex');
const cssPath = 'core/src/styles/base.css';
const stackPath = 'core/src/constants/theme-style-maps.ts';
const fontDir = 'cli/static/fonts/source-serif-4';
const pins = {
  LICENSE: '818e8dba24d293850aa1f7804d330512fdf29c5cd2b304235602d3176084534c',
  'pnpm-lock.yaml': '51f9cf09cce5254144be99ae86825a7d17094f45d38f33d9620a1c4d146e0255',
  'cli/adapter/index.js': '5dddfdbb44e41bda980f41617dbd3152a89a5122786455e8b95dd22b26d5dbc7',
  [cssPath]: '597eee1f88dc347327299ed2d449c29d0469a0bfc33e15090e1d8b3340e32b61',
  [stackPath]: '0388a1b54f101f848ff6bbca021255c0ebe8658a87ecb753f832b8c33e913f3e',
  [fontDir + '/SourceSerif4-Variable.woff2']:
    'c1df4596be5029233ed2afbb8b2f6ea20784b3fb1aa5d6b5c6519ccd85eb3dfb',
  [fontDir + '/SourceSerif4-Variable-italic.woff2']:
    '663e7ef3037a56dce81dfc33f68c1e6445995ffd8887991b3c0b68a7689c9da5'
};
// Verify every precondition before any mutation; fail on changed inputs.
const inputs = new Map();
for (const [path, expected] of Object.entries(pins)) {
  const bytes = await readFile(join(root, path));
  if (digest(bytes) !== expected) throw new Error('Unreviewed input: ' + path);
  inputs.set(path, bytes);
}
const expectedFonts = ['SourceSerif4-Variable-italic.woff2', 'SourceSerif4-Variable.woff2'];
const entries = (await readdir(join(root, fontDir))).sort();
if (JSON.stringify(entries) !== JSON.stringify(expectedFonts)) {
  throw new Error('Unexpected Source Serif directory contents');
}
const replaceOnce = (text, before, after) => {
  if (text.split(before).length !== 2) throw new Error('Expected one replacement anchor');
  return text.replace(before, after);
};
let css = inputs.get(cssPath).toString('utf8');
const start = css.indexOf('/* Source Serif 4 Variable Font (serif theme option) */');
const end = css.indexOf('/* Spectral (primary serif).', start);
if (start < 0 || end < 0) throw new Error('Missing CSS section anchors');
const removed = css.slice(start, end);
if ((removed.match(/@font-face/g) ?? []).length !== 2 ||
    (removed.match(/src: url/g) ?? []).length !== 2) {
  throw new Error('Unexpected Source Serif CSS');
}
css = css.slice(0, start) +
  '/* CLI build substitution: Source Serif files excluded; serif uses system fonts. */\n\n' +
  css.slice(end);
css = replaceOnce(css,
  'Studio ships these files; the CLI does not,\n   so local preview falls back to Source Serif 4 (next in the serif stack).',
  'Studio ships these files; the CLI does not,\n   and this CLI build uses the system serif stack.');
if (/SourceSerif4|source-serif-4|font-family: 'Source Serif 4'/.test(css)) {
  throw new Error('Source Serif CSS reference remains');
}
let stack = inputs.get(stackPath).toString('utf8');
stack = replaceOnce(stack,
  "* is Spectral (falling back to Source Serif 4), mono is Geist Mono — all\n * shipped as woff2. The CLI omits Spectral, so local preview lands on Source\n * Serif 4 via this same fallback.",
  "* uses system fonts in this CLI build; mono is Geist Mono.\n * The bundled Source Serif files are excluded before asset embedding.");
stack = replaceOnce(stack,
  "'Spectral', 'Source Serif 4', Georgia, 'Times New Roman', serif,",
  "Georgia, 'Times New Roman', serif,");
if (/Source Serif 4/.test(stack)) throw new Error('Source Serif stack reference remains');
const edits = [[cssPath, css], [stackPath, stack]];
const summary = {
  mode,
  upstreamCommit: '474ef4564f00e84991a055a3196fb32fd9d8d63a',
  edits: edits.map(([path, text]) => ({
    path, beforeSha256: pins[path], afterSha256: digest(Buffer.from(text))
  })),
  excludedFonts: expectedFonts.map((name) => ({
    path: fontDir + '/' + name, sha256: pins[fontDir + '/' + name]
  })),
  serifStack: "Georgia, 'Times New Roman', serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'"
};
if (mode === '--apply') {
  for (const [path, text] of edits) await writeFile(join(root, path), text);
  for (const name of expectedFonts) await unlink(join(root, fontDir, name));
}
console.log(JSON.stringify(summary, null, 2));
