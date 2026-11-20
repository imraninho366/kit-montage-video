// Relevé TikTok d'un épisode de L'Île des Abonnés — à exécuter dans le navigateur intégré, sur la page TikTok de
// la vidéo, onglet « Commentaires » ouvert. Lecture seule : ne clique sur rien, ne poste rien.
//
// À coller APRÈS analyse_commentaires.js (qui définit analyserCommentaires, commun à TikTok et YouTube).
// TikTok bloque tout envoi de la page vers la machine : l'analyse se fait donc ICI, et le script ne renvoie
// qu'un résumé court, que Claude enregistre dans src/compositions/ile/releves/tiktok_epNN_releve.json (+ .md).
(async () => {
  const TOURS = 30;          // défilements (≈ 20 commentaires de plus par tour)
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const liste = () => [...document.querySelectorAll('[class*="DivCommentItemWrapper"]')];
  const panneau = [...document.querySelectorAll('div')].find(
    (d) => d.scrollHeight > d.clientHeight + 200 && d.querySelector('[data-e2e="comment-level-1"]'));
  if (!panneau) return {erreur: 'panneau des commentaires introuvable : ouvrir l’onglet Commentaires'};
  if (typeof analyserCommentaires !== 'function') return {erreur: 'coller d’abord analyse_commentaires.js'};

  let avant = -1;
  for (let i = 0; i < TOURS; i++) {
    panneau.scrollTop = panneau.scrollHeight;
    await attendre(1300);
    const n = liste().length;
    if (n === avant) { await attendre(1500); if (liste().length === n) break; }
    avant = n;
  }

  const nombre = (s) => {
    const m = (s || '').replace(/\s/g, '').match(/^([\d.,]+)([kKmM]?)$/);
    if (!m) return 0;
    const v = parseFloat(m[1].replace(',', '.'));
    return Math.round(v * (/k/i.test(m[2]) ? 1e3 : /m/i.test(m[2]) ? 1e6 : 1));
  };
  const vus = new Set();
  const coms = [];
  for (const it of liste()) {
    const texte = it.querySelector('[data-e2e="comment-level-1"]')?.innerText.trim() ?? '';
    const lien = it.querySelector('a[href*="/@"]')?.getAttribute('href') ?? '';
    const pseudo = '@' + (lien.split('/@')[1] || '').split(/[/?]/)[0];
    const lignes = it.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
    const likes = nombre(lignes[lignes.length - 1]);
    const cle = pseudo + '|' + texte;
    if (!texte || vus.has(cle)) continue;
    vus.add(cle);
    coms.push({pseudo, texte, likes});
  }
  return {plateforme: 'tiktok', url: location.href.split('?')[0], ...analyserCommentaires(coms)};
})()
