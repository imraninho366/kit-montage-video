// Images fixes d'une ou plusieurs compositions en un seul bundle : node outils/stills_comp.mjs Comp:frame:sortie.jpg …
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (const arg of process.argv.slice(2)) {
  const [id, frame, sortie] = arg.split(':');
  const composition = await selectComposition({serveUrl, id});
  await renderStill({composition, serveUrl, frame: Number(frame), output: sortie, imageFormat: 'jpeg', jpegQuality: 75, scale: 0.5});
  console.log('ok', sortie);
}
