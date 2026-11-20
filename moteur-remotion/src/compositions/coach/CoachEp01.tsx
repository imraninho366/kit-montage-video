// LE COACH — épisode 1 « Momo ou Sofiane ? » (méthode F.pdf / Pixel2Foot).
// Décors et personnages : public/coach/pixel (outils/coach_pixel.py). Sons : public/coach/sons (outils/coach_sons.py).
// Voix : public/coach/ep01_voix.wav + ep01_voix.json (outils/voix_coach.py). Pas de musique, fonds fixes, aucune secousse.
import {loadFont as chargerPoppins} from '@remotion/google-fonts/Poppins';
import {loadFont as chargerPixel} from '@remotion/google-fonts/PressStart2P';
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './ep01_voix.json';

const poppins = chargerPoppins('normal', {weights: ['800', '900'], subsets: ['latin', 'latin-ext']});
const pixel = chargerPixel('normal', {subsets: ['latin']});
const TITRE = poppins.fontFamily;
const PIX = pixel.fontFamily;

const FPS = 30;
export const DUREE_COACH_EP01 = Math.ceil((voix.duree + 1.6) * FPS);
const BLEU = '#4fb3ff';
const ROUGE = '#e63946';
const FONDU = 8; // ≈ 270 ms

type Mot = {t: string; a: number; b: number; ligne: number};
const MOTS = voix.mots as Mot[];
const debutLigne = (l: number) => MOTS.find((m) => m.ligne === l)!.a;
const tMot = (l: number, mot: string) => {
  const m = MOTS.find((x) => x.ligne === l && x.t.toLowerCase().replace(/[^\p{L}\d-]/gu, '') === mot);
  if (!m) throw new Error(`mot introuvable : ${mot} (ligne ${l})`);
  return m.a;
};
const f = (s: number) => Math.round(s * FPS);

// ---------------------------------------------------------------- sous-titres (en haut, mot par mot, un mot en bleu)
type Jeton = {txt: string; a: number; b: number};
const NOMBRES: Record<string, string> = {
  cinq: '5', 'trente-quatre': '34', 'vingt-sept': '27', 'dix-neuf': '19H', onze: '11', 'vingt-deux': '22',
  'trente-huit': '38', neuf: '9', 'dix-sept': '17',
};
const CLES = new Set(['KARIM', 'MOMO', 'SOFIANE', 'DERNIER', 'DÉCISION', 'D1', 'CHEVILLE', 'LEADER', 'PARKING', 'PARS',
  'EXPÉRIENCE', 'VITESSE', 'CAPITAINE', 'JEAN', 'VESTIAIRE', 'TILLEULS', 'TOI', 'POSTE', 'NOMS', 'COMMENTAIRE']);

const jetons: Jeton[] = (() => {
  const out: Jeton[] = [];
  for (let i = 0; i < MOTS.length; i++) {
    const m = MOTS[i];
    const brut = m.t.replace(/[«»]/g, '').trim();
    if (!brut) continue;
    const nu = brut.toLowerCase().replace(/[.,?!]/g, '');
    const ponct = brut.match(/[.,?!]+$/)?.[0] ?? '';
    if (nu === 'heures' && MOTS[i - 1]?.t.toLowerCase().startsWith('dix-neuf')) {
      out[out.length - 1].txt = out[out.length - 1].txt.replace(/[.,?!]+$/, '') + ponct; out[out.length - 1].b = m.b; continue;
    }
    if (nu === 'deux' && MOTS[i + 1]?.t.toLowerCase().startsWith('mille')) {
      out.push({txt: '2 000', a: m.a, b: MOTS[i + 1].b}); i++; continue;
    }
    out.push({txt: (NOMBRES[nu] ?? brut.replace(/[.,?!]+$/, '')) + ponct, a: m.a, b: m.b});
  }
  return out.map((j) => ({...j, txt: j.txt.toUpperCase()}));
})();

type Bloc = {mots: Jeton[]; cle: number};
const blocs: Bloc[] = (() => {
  const out: Bloc[] = [];
  let cour: Jeton[] = [];
  const pousse = () => {
    if (!cour.length) return;
    let cle = cour.findIndex((j) => CLES.has(j.txt.replace(/[.,?!]/g, '')) || /\d/.test(j.txt));
    if (cle < 0) {
      let max = 0;
      cour.forEach((j, k) => { const n = j.txt.replace(/[^\p{L}]/gu, '').length; if (n > max) { max = n; cle = k; } });
      if (max < 4) cle = -1;
    }
    out.push({mots: cour, cle}); cour = [];
  };
  for (const j of jetons) {
    cour.push(j);
    if (/[.?!]$/.test(j.txt) || (/,$/.test(j.txt) && cour.length >= 2) || cour.length >= 4) pousse();
  }
  pousse();
  return out;
})();

const SousTitres: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const i = blocs.findIndex((b, k) => t >= b.mots[0].a - 0.03 && (k === blocs.length - 1 || t < blocs[k + 1].mots[0].a - 0.03));
  if (i < 0) return null;
  const b = blocs[i];
  if (t > b.mots[b.mots.length - 1].b + 0.7) return null;
  const longueur = b.mots.reduce((s, m) => s + m.txt.length + 1, 0);
  const taille = longueur > 24 ? 78 : longueur > 17 ? 92 : 108;
  return (
    <div style={{position: 'absolute', top: 250, left: 50, right: 130, textAlign: 'center', lineHeight: 1.05,
      fontFamily: TITRE, fontWeight: 900, fontSize: taille}}>
      {b.mots.map((m, k) => {
        if (t < m.a - 0.03) return null;
        const s = spring({frame: frame - f(m.a), fps: FPS, config: {damping: 14, stiffness: 260}, durationInFrames: 6});
        return (
          <span key={k} style={{display: 'inline-block', margin: '0 12px', transform: `scale(${0.7 + 0.3 * s})`,
            color: k === b.cle ? BLEU : '#ffffff', WebkitTextStroke: '14px #0b0f1a', paintOrder: 'stroke fill',
            textShadow: '0 8px 0 rgba(0,0,0,0.45)'}}>{m.txt}</span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- éléments pixel
const Decor: React.FC<{nom: string; sombre?: number}> = ({nom, sombre = 0.22}) => (
  <AbsoluteFill>
    <Img src={staticFile(`coach/pixel/${nom}.png`)} style={{width: 1080, height: 1920, imageRendering: 'pixelated'}} />
    <AbsoluteFill style={{background: `rgba(4,6,14,${sombre})`}} />
  </AbsoluteFill>
);

const Perso: React.FC<{nom: string; x: number; pied: number; echelle?: number; retard?: number}> = ({
  nom, x, pied, echelle = 1, retard = 0,
}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const w = 468 * echelle, h = 650 * echelle;
  const s = spring({frame, fps: FPS, config: {damping: 15, stiffness: 140}});
  const respire = Math.floor(frame / 14) % 2 === 0 ? 0 : -Math.round(6 * echelle);
  return (
    <>
      <div style={{position: 'absolute', left: x - w * 0.36, top: pied - 26 * echelle, width: w * 0.72, height: 44 * echelle,
        borderRadius: '50%', background: 'rgba(0,0,0,0.45)', opacity: s}} />
      <Img src={staticFile(`coach/pixel/${nom}.png`)} style={{position: 'absolute', left: x - w / 2, top: pied - h + respire + (1 - s) * 70,
        width: w, height: h, imageRendering: 'pixelated', opacity: s}} />
    </>
  );
};

const Ballon: React.FC<{x: number; y: number; taille?: number}> = ({x, y, taille = 12}) => {
  const g = ['..XXXX..', '.XWWWWX.', 'XWWXXWWX', 'XWXXXXWX', 'XWWXXWWX', 'XWWWWWWX', '.XWWWWX.', '..XXXX..'];
  return (
    <svg style={{position: 'absolute', left: x, top: y}} width={8 * taille} height={8 * taille} shapeRendering="crispEdges">
      {g.flatMap((l, j) => [...l].map((ch, i) => ch === '.' ? null : (
        <rect key={`${i}-${j}`} x={i * taille} y={j * taille} width={taille} height={taille} fill={ch === 'X' ? '#14161c' : '#f2f4f5'} />)))}
    </svg>
  );
};

const BadgeEpisode: React.FC = () => (
  <div style={{position: 'absolute', top: 150, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
    <div style={{fontFamily: PIX, fontSize: 26, color: '#bfe3ff', background: 'rgba(8,16,36,0.88)', border: `4px solid ${BLEU}`,
      borderRadius: 10, padding: '12px 20px', letterSpacing: 1}}>
      ÉP. 1 · <span style={{color: BLEU}}>LE COACH</span>
    </div>
  </div>
);

const BadgeRouge: React.FC<{texte: string; y?: number; retard?: number}> = ({texte, y = 600, retard = 0}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const s = spring({frame, fps: FPS, config: {damping: 12, stiffness: 220}});
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${0.6 + 0.4 * s})`, opacity: s, background: ROUGE, color: '#fff', fontFamily: TITRE, fontWeight: 900,
        fontSize: 50, padding: '10px 34px', borderRadius: 999, border: '6px solid #0b0f1a', boxShadow: '0 8px 0 rgba(0,0,0,0.45)', whiteSpace: 'nowrap'}}>
        {texte}
      </div>
    </div>
  );
};

const Carte: React.FC<{perso?: string; titre: string; sous?: string; x: number; y: number; angle: number; retard?: number}> = ({
  perso, titre, sous, x, y, angle, retard = 0,
}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const s = spring({frame, fps: FPS, config: {damping: 14, stiffness: 160}});
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - s) * 120, width: 400, height: 560, opacity: s,
      transform: `rotate(${angle}deg)`, background: '#f5efdf', border: '8px solid #14161c', borderRadius: 18,
      boxShadow: '0 14px 0 rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden'}}>
      {titre !== '?' ? <div style={{marginTop: 22, fontFamily: TITRE, fontWeight: 900, fontSize: 52, color: '#1d2f6f'}}>{titre}</div> : null}
      {sous ? <div style={{fontFamily: PIX, fontSize: 18, color: '#7a6f58', marginTop: 4}}>{sous}</div> : null}
      {perso ? (
        <Img src={staticFile(`coach/pixel/${perso}.png`)} style={{width: 280, height: 389, imageRendering: 'pixelated', marginTop: 18}} />
      ) : (
        <div style={{marginTop: titre === '?' ? 140 : 60, fontFamily: TITRE, fontWeight: 900, fontSize: 220, color: '#1d2f6f'}}>?</div>
      )}
    </div>
  );
};

const PointInterrogation: React.FC<{y: number}> = ({y}) => (
  <div style={{position: 'absolute', top: y, left: 0, right: 80, textAlign: 'center', fontFamily: TITRE, fontWeight: 900, fontSize: 150,
    color: '#fff', WebkitTextStroke: '14px #0b0f1a', paintOrder: 'stroke fill'}}>?</div>
);

const Classement: React.FC = () => {
  const frame = useCurrentFrame();
  const lignes = [['7', 'FC VAL-NORD', '24'], ['8', 'US BELAIR', '22'], ['9', 'AS MONTFORT', '19'], ['10', 'CS LES PINS', '17'],
    ['11', 'ES CHAMPVERT', '15'], ['12', 'AS TILLEULS 93', '9']];
  const clignote = Math.floor(frame / 10) % 2 === 0;
  return (
    <div style={{position: 'absolute', top: 720, left: 70, width: 860, background: '#f1efe6', border: '8px solid #6d4c35', borderRadius: 8,
      boxShadow: '0 14px 0 rgba(0,0,0,0.5)', fontFamily: PIX}}>
      <div style={{background: '#1e8f4e', color: '#fff', fontSize: 30, padding: '18px 24px'}}>R3 · CLASSEMENT</div>
      {lignes.map(([r, n, p], k) => {
        const dernier = k === lignes.length - 1;
        return (
          <div key={r} style={{display: 'flex', fontSize: 28, padding: '20px 24px', borderTop: '3px solid #d7d3c6',
            background: dernier ? (clignote ? '#f6b3b3' : '#f9d6d6') : 'transparent', color: dernier ? '#b3121f' : '#26313d',
            opacity: interpolate(frame, [k * 3, k * 3 + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
            <span style={{width: 80}}>{r}.</span><span style={{flex: 1}}>{n}</span><span>{p} PTS</span>
          </div>
        );
      })}
    </div>
  );
};

const Telephone: React.FC<{retard: number}> = ({retard}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const s = spring({frame, fps: FPS, config: {damping: 14, stiffness: 180}});
  return (
    <div style={{position: 'absolute', left: 520, top: 760 + (1 - s) * 80, width: 400, opacity: s, background: '#14161c', borderRadius: 34,
      padding: 18, border: '6px solid #2c303a', boxShadow: '0 14px 0 rgba(0,0,0,0.5)'}}>
      <div style={{background: '#e9eef3', borderRadius: 20, padding: '22px 18px', fontFamily: TITRE, fontWeight: 800}}>
        <div style={{fontSize: 24, color: '#1e8f4e'}}>GROUPE TILLEULS ⚽</div>
        <div style={{marginTop: 12, background: '#fff', borderRadius: 16, padding: '14px 16px', fontSize: 28, color: '#1a2230'}}>
          Entraînement mardi 19h. Présence obligatoire.
        </div>
        <div style={{marginTop: 10, fontSize: 22, color: '#6a7785', textAlign: 'right'}}>Vu par 22 · 11 réponses</div>
      </div>
    </div>
  );
};

const Bulle: React.FC<{texte: string; retard: number}> = ({texte, retard}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const s = spring({frame, fps: FPS, config: {damping: 13, stiffness: 200}});
  return (
    <div style={{position: 'absolute', left: 90, top: 640, width: 820, transform: `scale(${0.7 + 0.3 * s})`, opacity: s,
      background: '#ffe066', border: '8px solid #14161c', borderRadius: 26, padding: '24px 30px', boxShadow: '0 12px 0 rgba(0,0,0,0.45)',
      fontFamily: TITRE, fontWeight: 900, fontSize: 46, color: '#14161c', textAlign: 'center', lineHeight: 1.15}}>
      {texte}
      <div style={{position: 'absolute', bottom: -44, right: 210, width: 0, height: 0, borderLeft: '30px solid transparent',
        borderRight: '30px solid transparent', borderTop: '44px solid #14161c'}} />
    </div>
  );
};

const Fondu: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: interpolate(frame, [0, FONDU], [0, 1], {extrapolateRight: 'clamp'})}}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- scènes (une par ligne de voix)
const L = (l: number) => f(debutLigne(l)) - 4;
const R = (l: number, mot: string, scene = l) => Math.max(0, f(tMot(l, mot)) - L(scene)); // retard d'un élément dans sa scène

type Scene = {debut: number; contenu: React.ReactNode};
const SCENES: Scene[] = [
  {debut: 0, contenu: (<><Decor nom="vestiaire" sombre={0.6} /><Classement /><BadgeRouge texte="5 MATCHS RESTANTS" y={560} retard={f(1.0)} /></>)},
  {debut: L(1), contenu: (<><Decor nom="terrain_nuit" /><Perso nom="karim" x={500} pied={1480} />
    <BadgeRouge texte="KARIM · 34 ANS" y={600} retard={R(1, 'karim')} /></>)},
  {debut: L(2), contenu: (<><Decor nom="choix" /><Carte titre="?" x={90} y={760} angle={-5} /><Carte titre="?" x={560} y={760} angle={5} retard={5} />
    <BadgeRouge texte="C'EST TOI QUI DÉCIDES" y={600} retard={R(2, 'toi')} /></>)},
  {debut: L(3), contenu: (<><Decor nom="garage" /><Perso nom="president" x={330} pied={1500} />
    <Perso nom="karim" x={760} pied={1520} echelle={0.85} retard={6} />
    <BadgeRouge texte="5 MATCHS POUR SE SAUVER" y={600} retard={R(3, 'cinq')} />
    <BadgeRouge texte="SINON : DESCENTE EN D1" y={700} retard={R(3, 'descente')} /></>)},
  {debut: L(4), contenu: (<><Decor nom="terrain_nuit" sombre={0.35} /><Perso nom="karim" x={500} pied={1440} echelle={0.8} />
    <Ballon x={640} y={1380} />
    <BadgeRouge texte="CHEVILLE · 27 ANS · N2" y={600} retard={R(4, 'cheville')} /></>)},
  {debut: L(5), contenu: (<><Decor nom="vestiaire" /><Perso nom="karim" x={270} pied={1560} echelle={0.85} />
    <Telephone retard={R(5, 'onze')} /><BadgeRouge texte="11 JOUEURS SUR 22" y={600} retard={R(5, 'onze')} /></>)},
  {debut: L(6), contenu: (<><Decor nom="vestiaire" /><Perso nom="momo" x={500} pied={1500} />
    <BadgeRouge texte="MOMO · 38 ANS · CAPITAINE" y={600} retard={R(6, 'momo')} /></>)},
  {debut: L(7), contenu: (<><Decor nom="terrain_soir" /><Perso nom="sofiane" x={500} pied={1500} />
    <Ballon x={650} y={1420} />
    <BadgeRouge texte="SOFIANE · 17 ANS" y={600} retard={R(7, 'sofiane')} /></>)},
  {debut: L(8), contenu: (<><Decor nom="choix" /><Carte perso="momo" titre="MOMO" sous="L'EXPÉRIENCE" x={90} y={760} angle={-5} />
    <Carte perso="sofiane" titre="SOFIANE" sous="LA VITESSE" x={560} y={760} angle={5} retard={6} />
    <PointInterrogation y={940} /></>)},
  {debut: L(9), contenu: (<><Decor nom="terrain_nuit" /><Perso nom="momo" x={290} pied={1500} echelle={0.85} />
    <Perso nom="sofiane" x={720} pied={1500} echelle={0.85} retard={4} />
    <BadgeRouge texte="MÊME POSTE" y={600} retard={R(9, 'poste')} />
    <BadgeRouge texte="DIMANCHE · CONTRE LE LEADER" y={700} retard={R(9, 'leader')} /></>)},
  {debut: L(10), contenu: (<><Decor nom="parking" /><Perso nom="momo" x={700} pied={1560} echelle={0.9} />
    <Perso nom="karim" x={290} pied={1580} echelle={0.85} retard={R(10, 'karim')} /></>)},
  {debut: L(11), contenu: (<><Decor nom="parking" sombre={0.35} /><Perso nom="momo" x={700} pied={1560} echelle={0.9} />
    <Perso nom="karim" x={290} pied={1580} echelle={0.85} />
    <Bulle texte="« Si tu mets le petit à ma place, je pars. Et la moitié du vestiaire part avec moi. »" retard={2} /></>)},
  {debut: L(12), contenu: (<><Decor nom="choix" /><Carte titre="TITULAIRE" x={340} y={760} angle={0} />
    <BadgeRouge texte="1 PLACE · 2 NOMS" y={600} retard={2} /></>)},
  {debut: L(13), contenu: (<><Decor nom="choix" /><Carte perso="momo" titre="MOMO" sous="LE CAPITAINE" x={90} y={760} angle={-5} />
    <Carte perso="sofiane" titre="SOFIANE" sous="LE GAMIN" x={560} y={760} angle={5} retard={R(13, 'sofiane')} />
    <PointInterrogation y={940} />
    <BadgeRouge texte="KARIM DOIT CHOISIR" y={600} retard={2} />
    <BadgeRouge texte="LA SUITE À 2 000 ❤️" y={1380} retard={R(14, 'suite', 13)} /></>)},
];

// ---------------------------------------------------------------- bruitages calés sur les mots
type Son = {nom: string; a: number; vol: number};
const SONS: Son[] = [
  {nom: 'coup', a: 0.05, vol: 0.55},
  {nom: 'tic', a: 1.0, vol: 0.5},
  {nom: 'whoosh', a: debutLigne(1) - 0.2, vol: 0.35},
  {nom: 'sifflet', a: tMot(1, 'entraîneur'), vol: 0.22},
  {nom: 'whoosh', a: debutLigne(2) - 0.2, vol: 0.35},
  {nom: 'tic', a: debutLigne(2), vol: 0.5}, {nom: 'tic', a: debutLigne(2) + 0.17, vol: 0.5},
  {nom: 'porte', a: debutLigne(3) - 0.1, vol: 0.4},
  {nom: 'coup', a: tMot(3, 'descente'), vol: 0.45},
  {nom: 'ballon', a: debutLigne(4) + 0.2, vol: 0.4}, {nom: 'ballon', a: debutLigne(4) + 1.1, vol: 0.32},
  {nom: 'coup', a: tMot(4, 'cheville'), vol: 0.4},
  {nom: 'porte', a: debutLigne(5) - 0.1, vol: 0.35},
  {nom: 'notif', a: tMot(5, 'onze'), vol: 0.4},
  {nom: 'notif', a: tMot(5, 'répondent'), vol: 0.3},
  {nom: 'pop', a: tMot(6, 'momo'), vol: 0.45},
  {nom: 'whoosh', a: debutLigne(7) - 0.2, vol: 0.35},
  {nom: 'ballon', a: tMot(7, 'rapide'), vol: 0.4},
  {nom: 'tic', a: tMot(8, 'lexpérience'), vol: 0.5}, {nom: 'tic', a: tMot(8, 'vitesse'), vol: 0.5},
  {nom: 'foule', a: tMot(9, 'dimanche'), vol: 0.16},
  {nom: 'moteur', a: debutLigne(10) - 0.2, vol: 0.22},
  {nom: 'coup', a: tMot(11, 'pars'), vol: 0.5},
  {nom: 'tic', a: debutLigne(12), vol: 0.5},
  {nom: 'whoosh', a: debutLigne(13) - 0.2, vol: 0.35},
  {nom: 'ding', a: debutLigne(14), vol: 0.35},
];

export const CoachEp01: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map((s, k) => {
        const fin = k === SCENES.length - 1 ? durationInFrames : SCENES[k + 1].debut + FONDU;
        return (
          <Sequence key={k} from={s.debut} durationInFrames={fin - s.debut}>
            {k === 0 ? <AbsoluteFill>{s.contenu}</AbsoluteFill> : <Fondu>{s.contenu}</Fondu>}
          </Sequence>
        );
      })}
      <BadgeEpisode />
      <SousTitres />
      <Audio src={staticFile('coach/ep01_voix.wav')} />
      {SONS.map((s, k) => (
        <Sequence key={k} from={Math.max(0, f(s.a))}>
          <Audio src={staticFile(`coach/sons/${s.nom}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- couverture (prompt 15)
export const CoachCouv01: React.FC = () => (
  <AbsoluteFill>
    <Decor nom="choix" sombre={0.1} />
    <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: PIX, fontSize: 34, color: '#bfe3ff', background: 'rgba(8,16,36,0.9)', border: `5px solid ${BLEU}`,
        borderRadius: 12, padding: '14px 26px'}}>ÉPISODE 1</div>
    </div>
    <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center', fontFamily: TITRE, fontWeight: 900, lineHeight: 0.98,
      WebkitTextStroke: '18px #0b0f1a', paintOrder: 'stroke fill', textShadow: '0 12px 0 rgba(0,0,0,0.45)'}}>
      <div style={{fontSize: 210, color: '#fff'}}>MOMO</div>
      <div style={{fontSize: 140, color: '#fff'}}>OU <span style={{color: BLEU}}>SOFIANE</span> ?</div>
    </div>
    <div style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: ROUGE, color: '#fff', fontFamily: TITRE, fontWeight: 900, fontSize: 64, padding: '12px 44px', borderRadius: 999,
        border: '7px solid #0b0f1a'}}>KARIM DOIT CHOISIR</div>
    </div>
    <Img src={staticFile('coach/pixel/momo.png')} style={{position: 'absolute', left: 40, top: 1000, width: 400, height: 556, imageRendering: 'pixelated'}} />
    <Img src={staticFile('coach/pixel/sofiane.png')} style={{position: 'absolute', right: 40, top: 1000, width: 400, height: 556, imageRendering: 'pixelated'}} />
    <Img src={staticFile('coach/pixel/karim.png')} style={{position: 'absolute', left: 290, top: 1180, width: 500, height: 694, imageRendering: 'pixelated'}} />
  </AbsoluteFill>
);
