// Rend une liste d'images d'une composition en un seul regroupement (bundle) : bien plus rapide que N « remotion still ».
//   node outils/images-cles.mjs Glasses01 dossier-sortie 165 435 1050 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [id, sortie, ...images] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const composition = await selectComposition({serveUrl, id});
for (const f of images.map(Number)) {
  await renderStill({composition, serveUrl, frame: f, output: path.join(sortie, `i${String(f).padStart(5, '0')}.jpg`), imageFormat: 'jpeg',
    chromiumOptions: {gl: 'angle'}, timeoutInMilliseconds: 120000});
  process.stdout.write(`${f} `);
}
console.log('\nfini');
