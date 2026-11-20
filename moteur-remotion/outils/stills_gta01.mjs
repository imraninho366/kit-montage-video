// Rend des images fixes de GTA01 en un seul bundle : node outils/stills_gta01.mjs nom:frame nom:frame …
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'GTA01'});
for (const arg of process.argv.slice(2)) {
  const [nom, frame] = arg.split(':');
  await renderStill({composition, serveUrl, frame: Number(frame), output: `rendus/gta01/stills/${nom}.jpg`, imageFormat: 'jpeg', jpegQuality: 70, scale: 0.5});
  console.log('ok', nom);
}
