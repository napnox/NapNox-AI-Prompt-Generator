#!/usr/bin/env node
/**
 * Packages the WordPress plugin for upload.
 *
 * Run AFTER `npm run build:wp` (which emits the bundle straight into the
 * plugin's assets/ folder). This copies the shared master config in beside
 * the PHP, then zips the whole plugin directory if `zip` is available.
 *
 * Usage: npm run package:wp
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pluginDir = join(root, 'wordpress-plugin', 'napnox-prompt-generator');
const distDir = join(root, 'wordpress-plugin', 'dist');

if (!existsSync(join(pluginDir, 'assets', 'napnox-app.js'))) {
  console.error('\nMissing assets/napnox-app.js - run `npm run build:wp` first.\n');
  process.exit(1);
}

// The React client and the PHP backend read the same config file.
mkdirSync(join(pluginDir, 'shared'), { recursive: true });
cpSync(join(root, 'shared', 'master-config.json'), join(pluginDir, 'shared', 'master-config.json'));
console.log('Copied shared/master-config.json into the plugin.');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

try {
  execFileSync('zip', ['-r', '-q', join(distDir, 'napnox-prompt-generator.zip'), 'napnox-prompt-generator'], {
    cwd: join(root, 'wordpress-plugin'),
    stdio: 'inherit',
  });
  console.log('\nBuilt wordpress-plugin/dist/napnox-prompt-generator.zip');
  console.log('Upload it at Plugins > Add New > Upload Plugin.\n');
} catch {
  console.log('\n`zip` is not available on this machine.');
  console.log(`Zip this folder manually instead: ${pluginDir}\n`);
}
