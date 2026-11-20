// Relevés de L'Île des Abonnés.
//
//   node outils/ile/releve.mjs youtube <url du Short> ep02   → commentaires YouTube (yt-dlp) → releves/youtube_ep02_releve.json + .md
//   node outils/ile/releve.mjs md releves/tiktok_ep02_releve.json   → écrit le tableau .md d'un résumé déjà enregistré (TikTok)
//
// YouTube : yt-dlp récupère les commentaires (contrairement à TikTok, où il faut le navigateur intégré).
// Seuls les commentaires de premier niveau comptent ; l'analyse est celle de analyse_commentaires.js (commune aux deux plateformes).
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const RELEVES = join(ICI, '../../src/compositions/ile/releves');
const analyserCommentaires = new Function(readFileSync(join(ICI, 'analyse_commentaires.js'), 'utf8') + '\nreturn analyserCommentaires;')();

const tableau = (r) => {
  const L = ['A', 'B', 'C'];
  const md = [`# Relevé ${r.plateforme} — ${r.releve_le}`, '', r.url ?? '', '',
    `${r.commentaires} commentaires lus, ${r.votants} votes reconnus (une voix par pseudo).`, '',
    '| Lettre | Personnes | Likes sur ces votes | Score |', '|---|---|---|---|',
    ...L.map((l) => `| ${l} | ${r.votes[l].personnes} | ${r.votes[l].likes} | ${r.score[l]} |`), '',
    `**Gagnant : ${r.gagnant}**${r.serre ? ' — écart < 10 %, à trancher par Imran' : ''}`, '',
    '## Demandes spéciales (les plus likées)', '', '| Likes | Pseudo | Demande | |', '|---|---|---|---|',
    ...r.demandes.map((d) => `| ${d.likes} | ${d.pseudo} | ${d.texte.replace(/\|/g, '/').replace(/\n/g, ' ')} | ${d.ecarter ? '⛔ à écarter' : ''} |`), '',
    `## Cabanes standard (${r.cabanes_standard.length})`, '', r.cabanes_standard.join(', '), ''];
  return md.join('\n');
};

const [mode, ...args] = process.argv.slice(2);
if (mode === 'youtube') {
  const [url, ep] = args;
  if (!url || !ep) throw new Error('usage : node outils/ile/releve.mjs youtube <url> ep02');
  const tmp = mkdtempSync(join(tmpdir(), 'ile-yt-'));
  execFileSync('yt-dlp', ['--skip-download', '--write-comments', '--no-warnings', '-q',
    '--extractor-args', 'youtube:comment_sort=top;max_comments=600,all,0', '-o', join(tmp, 'v.%(ext)s'), url], {stdio: 'inherit'});
  const info = JSON.parse(readFileSync(join(tmp, 'v.info.json'), 'utf8'));
  const coms = (info.comments ?? [])
    .filter((c) => !c.parent || c.parent === 'root')
    .map((c) => ({pseudo: c.author ?? c.author_id, texte: (c.text ?? '').trim(), likes: c.like_count ?? 0}))
    .filter((c) => c.texte);
  const r = {plateforme: 'youtube', url, ...analyserCommentaires(coms)};
  mkdirSync(RELEVES, {recursive: true});
  const base = join(RELEVES, `youtube_${ep}_releve`);
  writeFileSync(base + '.json', JSON.stringify(r, null, 1));
  writeFileSync(base + '.md', tableau(r));
  console.log(tableau(r).split('\n').slice(0, 14).join('\n'));
} else if (mode === 'md') {
  const fichier = args[0];
  const r = JSON.parse(readFileSync(fichier, 'utf8'));
  writeFileSync(fichier.replace(/\.json$/, '.md'), tableau(r));
  console.log('écrit :', fichier.replace(/\.json$/, '.md'));
} else {
  console.log('usage : node outils/ile/releve.mjs youtube <url> ep02  |  node outils/ile/releve.mjs md <résumé.json>');
}
