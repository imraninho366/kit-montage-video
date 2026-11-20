// Comme stills_comp.mjs, mais sur le bundle déjà construit (npx remotion bundle --out-dir build) : évite de recopier public/ (1,1 Go).
// node outils/stills_build.mjs Comp:frame:sortie.jpg …
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const serveUrl = path.resolve('build');
for (const arg of process.argv.slice(2)) {
  const [id, frame, sortie] = arg.split(':');
  const composition = await selectComposition({serveUrl, id, chromiumOptions: {gl: 'angle'}});
  await renderStill({composition, serveUrl, frame: Number(frame), output: sortie, imageFormat: 'jpeg', jpegQuality: 75, scale: 0.5, chromiumOptions: {gl: 'angle'}});
  console.log('ok', sortie);
}
