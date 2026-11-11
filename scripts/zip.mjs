/**
 * Zips the packaged app for sharing: release/BlobWars-<version>-win-x64.zip, holding one "BlobWars"
 * folder. A friend extracts it anywhere and runs BlobWars\BlobWars.exe — no installer, no admin rights.
 *
 * Uses Windows' own bsdtar (System32\tar.exe, Windows 10+), which writes real zip files fast; the
 * Git-for-Windows `tar` that may come first on PATH is GNU tar and cannot, hence the full path.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const src = 'BlobWars-win32-x64';
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'release');
const out = path.join(outDir, `BlobWars-${version}-win-x64.zip`);
const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');

if (!existsSync(path.join(dist, src, 'BlobWars.exe'))) throw new Error(`Run "npm run package" first: ${src}/BlobWars.exe is missing`);
mkdirSync(outDir, { recursive: true });
rmSync(out, { force: true });

// The folder inside the zip should be a friendly "BlobWars". Windows' bsdtar has no -s to rename entries,
// so rename the packaged folder for the moment of zipping (instant, unlike copying 250 MB) and always put it back.
const top = 'BlobWars';
if (existsSync(path.join(dist, top))) throw new Error(`dist/${top} already exists — remove it and retry`);
renameSync(path.join(dist, src), path.join(dist, top));
try {
  // -a picks the format from the .zip extension
  execFileSync(tar, ['-a', '-c', '-f', out, '-C', dist, top], { stdio: 'inherit' });
} finally {
  renameSync(path.join(dist, top), path.join(dist, src));
}
console.log(`zipped → ${out} (${(statSync(out).size / 1048576).toFixed(1)} MB)`);
