/**
 * Zips the packaged app for sharing: release/BlobWars-<version>-win-x64.zip, holding one "BlobWars"
 * folder. A friend extracts it anywhere and runs BlobWars\BlobWars.exe — no installer, no admin rights.
 *
 * Uses Windows' own bsdtar (System32\tar.exe, Windows 10+), which writes real zip files fast; the
 * Git-for-Windows `tar` that may come first on PATH is GNU tar and cannot, hence the full path.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
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

// -a picks the format from the .zip extension; -s renames the top folder to a friendlier "BlobWars"
execFileSync(tar, ['-a', '-c', '-f', out, '-s', `,^${src},BlobWars,`, '-C', dist, src], { stdio: 'inherit' });
console.log(`zipped → ${out} (${(statSync(out).size / 1048576).toFixed(1)} MB)`);
