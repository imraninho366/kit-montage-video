// Analyse commune des commentaires de L'Île des Abonnés (TikTok ET YouTube : même règles des deux côtés).
// Script simple, sans import ni export : il se colle tel quel dans le navigateur (avant extraire_commentaires.js)
// et releve_youtube.mjs le charge en Node.
//
// Entrée : [{pseudo, texte, likes}]. Sortie : résumé {commentaires, votants, votes, score, gagnant, serre, demandes, cabanes_standard}.
// Vote : une seule voix par pseudo. Compte comme vote un commentaire qui désigne clairement UNE lettre :
// « B », « (b) », « je vote B », « team C », « AAA »… Le « a » minuscule d'une phrase (« il a ») ne compte pas.
// Score = personnes + likes reçus par leurs commentaires de vote (les gens d'accord qui n'écrivent pas).
// C'est un sondage sur les commentaires chargés (les plus populaires d'abord), pas un total exact.
function analyserCommentaires(coms) {
  const LETTRES = ['A', 'B', 'C'];
  coms = [...coms].sort((a, b) => b.likes - a.likes);

  const lettreVotee = (t) => {
    const nu = t.replace(/[^A-Za-z]/g, '');
    if (nu && new Set(nu.toUpperCase()).size === 1 && LETTRES.includes(nu[0].toUpperCase()) && nu.length <= 6) return nu[0].toUpperCase();
    const trouvees = new Set();
    for (const m of t.matchAll(/\(\s*([abcABC])\s*\)/g)) trouvees.add(m[1].toUpperCase());
    for (const m of t.matchAll(/(?:vote|voté|votes|choix|team|je prends|je choisis|go|pour le|pour la|rejoins|rejoint|je veux le|je commente)\s*(?:le |la |la lettre )?([abcABC])(?![A-Za-zÀ-ÿ])/gi)) trouvees.add(m[1].toUpperCase());
    if (t.split(/\s+/).length <= 6) for (const m of t.matchAll(/(?<![A-Za-zÀ-ÿ'’])([ABC])(?![A-Za-zÀ-ÿ'’])/g)) trouvees.add(m[1]);
    return trouvees.size === 1 ? [...trouvees][0] : null;
  };
  const DEMANDE = /maison|cabane|villa|manoir|construi|je veux|j'aimerais|j’aimerais|fais|faites|mettez|ajoute|piscine|magasin|resto|bateau|radeau|château|chateau|tour|statue|forme|bunker|stade|chef|habitant/i;
  const ECARTER = /\b(pute|salope|encul|nique|ntm|fdp|connard|bite|sexe|porn|nazi|hitler|terror|mcdo|mcdonald|kfc|burger king|nike|adidas|coca|apple|tesla|disney|minecraft|among ?us|micromania)\b/i;
  // demande « banale » = uniquement des mots de ce lexique (lettres répétées écrasées : maisonnnn → maison)
  const LEXIQUE = new Set(('moi je j jveux jveut veux veut vx une un ma mon mes mais maison maisons stp svp stop aussi avoir peux peut ' +
    'pe bien trop coucou cc pour et a b c le la s il te plait plais suis abone abonee elle est ou donne omg yo wsh pls please ' +
    'voila commente comente envie veu stpp').split(' ').map((w) => w.replace(/(.)\1+/g, '$1')));
  const banal = (t) => {
    const mots = t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z' ]/g, ' ').split(/[\s']+/).filter(Boolean);
    return mots.length > 0 && mots.every((w) => LEXIQUE.has(w.replace(/(.)\1+/g, '$1')));
  };

  const votes = Object.fromEntries(LETTRES.map((l) => [l, {personnes: 0, likes: 0}]));
  const aVote = new Set();
  const demandes = [];
  for (const c of coms) {
    const l = lettreVotee(c.texte);
    if (l && !aVote.has(c.pseudo)) { aVote.add(c.pseudo); votes[l].personnes++; votes[l].likes += c.likes; }
    const reste = c.texte.replace(/\(\s*[abcABC]\s*\)/g, '').trim();
    if (reste.split(/\s+/).length >= 3 && DEMANDE.test(reste)) {
      demandes.push({pseudo: c.pseudo, texte: c.texte.slice(0, 140), likes: c.likes,
        banal: banal(reste), ecarter: ECARTER.test(c.texte)});
    }
  }
  const score = Object.fromEntries(LETTRES.map((l) => [l, votes[l].personnes + votes[l].likes]));
  const tri = Object.values(score).sort((a, b) => b - a);
  const gagnant = LETTRES.reduce((g, l) => (score[l] > score[g] ? l : g), 'A');
  return {
    releve_le: new Date().toISOString().slice(0, 16),
    commentaires: coms.length,
    votants: aVote.size,
    votes, score, gagnant,
    serre: tri[0] > 0 && (tri[0] - tri[1]) / tri[0] < 0.1,
    // les demandes « banales » (« je veux ma maison stp ») donnent juste droit à une cabane standard à leur nom
    demandes: demandes.filter((d) => !d.banal).slice(0, 30),
    cabanes_standard: demandes.filter((d) => d.banal && !d.ecarter).slice(0, 40).map((d) => d.pseudo),
  };
}
