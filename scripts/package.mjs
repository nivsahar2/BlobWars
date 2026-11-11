/**
 * Packages the game into a standalone Windows app: dist/BlobWars-win32-x64/BlobWars.exe.
 *
 * Done through the packager API (not the CLI) so the Hebrew product name reaches the exe's
 * version resource intact — command-line arguments on Windows can mangle non-ASCII text.
 */
import { packager } from '@electron/packager';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const [out] = await packager({
  dir: root,
  out: path.join(root, 'dist'),
  name: 'BlobWars', // folder + exe name stay ASCII; the window title and shortcut carry the Hebrew name
  executableName: 'BlobWars',
  platform: 'win32',
  arch: 'x64',
  icon: path.join(root, 'build', 'icon.ico'),
  asar: true,
  overwrite: true,
  appVersion: pkg.version,
  appCopyright: 'מלחמת הבלובים',
  win32metadata: {
    ProductName: pkg.productName,
    FileDescription: pkg.productName,
    InternalName: 'BlobWars',
    CompanyName: 'Blob Wars',
  },
  // Ship only what the app needs at runtime: main.js, app/ (with app/vendor), build/icon.ico, package.json.
  // node_modules is excluded outright: the app has no runtime dependencies, and prune was leaving
  // the packager's own dev tooling inside app.asar. release/ holds the shareable zip of a previous
  // build — it must never end up inside the next one. Git metadata isn't needed at runtime either.
  ignore: [/^\/node_modules($|\/)/, /^\/dist($|\/)/, /^\/release($|\/)/, /^\/scripts($|\/)/, /^\/build\/icon\.png$/, /^\/\.claude($|\/)/, /^\/\.git/, /\.md$/],
});

console.log(`packaged → ${out}`);
