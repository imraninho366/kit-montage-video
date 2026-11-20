// LE COACH — épisode 2 « Bilal ou le groupe ? » (méthode F.pdf / Pixel2Foot). Vote ép. 1 : SOFIANE.
// Même charte que CoachEp01 : décors/persos public/coach/pixel (outils/coach_pixel.py), sons public/coach/sons,
// voix public/coach/ep02_voix.wav + ep02_voix.json (outils/voix_coach.py ep02). Pas de musique, fonds fixes, aucune secousse.
import {loadFont as chargerPoppins} from '@remotion/google-fonts/Poppins';
import {loadFont as chargerPixel} from '@remotion/google-fonts/PressStart2P';
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import voix from './ep02_voix.json';

const poppins = chargerPoppins('normal', {weights: ['800', '900'], subsets: ['latin', 'latin-ext']});
const pixel = chargerPixel('normal', {subsets: ['latin']});
const TITRE = poppins.fontFamily;
const PIX = pixel.fontFamily;

const FPS = 30;
export const DUREE_COACH_EP02 = Math.ceil((voix.duree + 1.6) * FPS);
const BLEU = '#4fb3ff';
const ROUGE = '#e63946';
const FONDU = 8;

type Mot = {t: string; a: number; b: number; ligne: number};
const MOTS = voix.mots as Mot[];
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\d-]/gu, '');
const debutLigne = (l: number) => MOTS.find((m) => m.ligne === l)!.a;
const tMot = (l: number, mot: string) => {
  const m = MOTS.find((x) => x.ligne === l && norm(x.t) === mot);
  if (!m) throw new Error(`mot introuvable : ${mot} (ligne ${l})`);
  return m.a;
};
const f = (s: number) => Math.round(s * FPS);

// ---------------------------------------------------------------- sous-titres
type Jeton = {txt: string; a: number; b: number};
const NOMBRES: Record<string, string> = {
  douze: '12', quatre: '4', dix: '10', 'dix-sept': '17', 'vingt-neuf': '29', 'zéro-zéro': '0-0', 'deux-un': '2-1',
  'soixante-dixième': '70E', 'quatre-vingt-cinquième': '85E',
};
const CLES = new Set(['SOFIANE', 'MOMO', 'PAROLE', 'KARIM', 'TOI', 'LEADER', 'TITULAIRE', '0-0', 'BUT', 'BANC', '2-1', 'DERNIERS',
  'SAUVEUR', 'RESTÉS', 'BILAL', 'NATIONAL', 'BAGARRE', 'LICENCE', 'JOUER', 'SAISON', 'VESTIAIRE', 'GROUPE', 'COMMENTAIRE']);

const jetons: Jeton[] = (() => {
  const out: Jeton[] = [];
  for (let i = 0; i < MOTS.length; i++) {
    const m = MOTS[i];
    const brut = m.t.replace(/[«»…]/g, '').trim();
    if (!brut) continue;
    const nu = brut.toLowerCase().replace(/[.,?!]/g, '');
    const ponct = brut.match(/[.,?!]+$/)?.[0] ?? '';
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

const Perso: React.FC<{nom: string; x: number; pied: number; echelle?: number; retard?: number; versX?: number; duree?: number}> = ({
  nom, x, pied, echelle = 1, retard = 0, versX, duree = 60,
}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const w = 468 * echelle, h = 650 * echelle;
  const s = spring({frame, fps: FPS, config: {damping: 15, stiffness: 140}});
  const cx = versX === undefined ? x : interpolate(frame, [0, duree], [x, versX], {extrapolateRight: 'clamp'});
  const bouge = versX !== undefined && frame < duree;
  const respire = bouge ? (Math.floor(frame / 5) % 2 === 0 ? 0 : -Math.round(14 * echelle))
    : (Math.floor(frame / 14) % 2 === 0 ? 0 : -Math.round(6 * echelle));
  return (
    <>
      <div style={{position: 'absolute', left: cx - w * 0.36, top: pied - 26 * echelle, width: w * 0.72, height: 44 * echelle,
        borderRadius: '50%', background: 'rgba(0,0,0,0.45)', opacity: s}} />
      <Img src={staticFile(`coach/pixel/${nom}.png`)} style={{position: 'absolute', left: cx - w / 2, top: pied - h + respire + (1 - s) * 70,
        width: w, height: h, imageRendering: 'pixelated', opacity: s}} />
    </>
  );
};

const Ballon: React.FC<{x: number; y: number; taille?: number; versX?: number; versY?: number; duree?: number; retard?: number}> = ({
  x, y, taille = 12, versX, versY, duree = 60, retard = 0,
}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const k = interpolate(frame, [0, duree], [0, 1], {extrapolateRight: 'clamp'});
  const bx = versX === undefined ? x : x + (versX - x) * k;
  const by = versY === undefined ? y : y + (versY - y) * k;
  const g = ['..XXXX..', '.XWWWWX.', 'XWWXXWWX', 'XWXXXXWX', 'XWWXXWWX', 'XWWWWWWX', '.XWWWWX.', '..XXXX..'];
  return (
    <svg style={{position: 'absolute', left: bx, top: by}} width={8 * taille} height={8 * taille} shapeRendering="crispEdges">
      {g.flatMap((l, j) => [...l].map((ch, i) => ch === '.' ? null : (
        <rect key={`${i}-${j}`} x={i * taille} y={j * taille} width={taille} height={taille} fill={ch === 'X' ? '#14161c' : '#f2f4f5'} />)))}
    </svg>
  );
};

const BadgeEpisode: React.FC = () => (
  <div style={{position: 'absolute', top: 150, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
    <div style={{fontFamily: PIX, fontSize: 26, color: '#bfe3ff', background: 'rgba(8,16,36,0.88)', border: `4px solid ${BLEU}`,
      borderRadius: 10, padding: '12px 20px', letterSpacing: 1}}>
      ÉP. 2 · <span style={{color: BLEU}}>LE COACH</span>
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

const Carte: React.FC<{perso?: string; titre: string; sous?: string; x: number; y: number; angle: number; retard?: number; coche?: boolean}> = ({
  perso, titre, sous, x, y, angle, retard = 0, coche = false,
}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const s = spring({frame, fps: FPS, config: {damping: 14, stiffness: 160}});
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - s) * 120, width: 400, height: 560, opacity: s,
      transform: `rotate(${angle}deg)`, background: '#f5efdf', border: `8px solid ${coche ? '#1e8f4e' : '#14161c'}`, borderRadius: 18,
      boxShadow: '0 14px 0 rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden'}}>
      {titre !== '?' ? <div style={{marginTop: 22, fontFamily: TITRE, fontWeight: 900, fontSize: 52, color: '#1d2f6f'}}>{titre}</div> : null}
      {sous ? <div style={{fontFamily: PIX, fontSize: 18, color: '#7a6f58', marginTop: 4}}>{sous}</div> : null}
      {perso ? (
        <Img src={staticFile(`coach/pixel/${perso}.png`)} style={{width: 280, height: 389, imageRendering: 'pixelated', marginTop: 18}} />
      ) : (
        <div style={{marginTop: titre === '?' ? 140 : 60, fontFamily: TITRE, fontWeight: 900, fontSize: 220, color: '#1d2f6f'}}>?</div>
      )}
      {coche ? (
        <div style={{position: 'absolute', top: 14, right: 14, width: 74, height: 74, borderRadius: 999, background: '#1e8f4e',
          border: '6px solid #14161c', color: '#fff', fontFamily: TITRE, fontWeight: 900, fontSize: 46, display: 'flex',
          alignItems: 'center', justifyContent: 'center'}}>✓</div>
      ) : null}
    </div>
  );
};

const PointInterrogation: React.FC<{y: number}> = ({y}) => (
  <div style={{position: 'absolute', top: y, left: 0, right: 80, textAlign: 'center', fontFamily: TITRE, fontWeight: 900, fontSize: 150,
    color: '#fff', WebkitTextStroke: '14px #0b0f1a', paintOrder: 'stroke fill'}}>?</div>
);

// Tableau d'affichage : le score change aux instants donnés (frames relatives à la scène).
const Score: React.FC<{etapes: [number, number, number][]; libelle?: string; y?: number}> = ({etapes, libelle, y = 700}) => {
  const frame = useCurrentFrame();
  let cour = etapes[0];
  for (const e of etapes) if (frame >= e[0]) cour = e;
  const depuis = frame - cour[0];
  const flash = cour !== etapes[0] && depuis < 12 && Math.floor(depuis / 3) % 2 === 0;
  return (
    <div style={{position: 'absolute', top: y, left: 120, width: 760, background: '#0e1320', border: '8px solid #2b3446', borderRadius: 14,
      boxShadow: '0 14px 0 rgba(0,0,0,0.5)', fontFamily: PIX, color: '#ffd23f', padding: '22px 26px'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <span style={{fontSize: 28, color: '#ffffff', width: 250}}>TILLEULS</span>
        <span style={{fontSize: 92, color: flash ? '#ffffff' : '#ffd23f', letterSpacing: 6}}>{cour[1]}-{cour[2]}</span>
        <span style={{fontSize: 28, color: '#ffffff', width: 250, textAlign: 'right'}}>LEADER</span>
      </div>
      {libelle ? <div style={{marginTop: 10, textAlign: 'center', fontSize: 24, color: '#8fa3c0'}}>{libelle}</div> : null}
    </div>
  );
};

const Classement: React.FC = () => {
  const frame = useCurrentFrame();
  const lignes = [['7', 'FC VAL-NORD', '25'], ['8', 'US BELAIR', '25'], ['9', 'AS MONTFORT', '20'], ['10', 'CS LES PINS', '18'],
    ['11', 'ES CHAMPVERT', '16'], ['12', 'AS TILLEULS 93', '9']];
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

const Appel: React.FC<{retard: number}> = ({retard}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const s = spring({frame, fps: FPS, config: {damping: 14, stiffness: 180}});
  const vibre = Math.floor(frame / 4) % 2 === 0 ? -4 : 4;
  return (
    <div style={{position: 'absolute', left: 520, top: 720 + (1 - s) * 80, width: 400, opacity: s, background: '#14161c', borderRadius: 34,
      padding: 18, border: '6px solid #2c303a', boxShadow: '0 14px 0 rgba(0,0,0,0.5)', transform: `rotate(${vibre * 0.4}deg)`}}>
      <div style={{background: '#1b2333', borderRadius: 20, padding: '40px 18px 34px', fontFamily: TITRE, fontWeight: 800, textAlign: 'center'}}>
        <div style={{fontSize: 24, color: '#8fa3c0'}}>Appel entrant…</div>
        <div style={{marginTop: 14, fontSize: 64, fontWeight: 900, color: '#ffffff'}}>BILAL</div>
        <div style={{marginTop: 30, display: 'flex', justifyContent: 'space-around'}}>
          <div style={{width: 90, height: 90, borderRadius: 999, background: ROUGE, border: '5px solid #0b0f1a'}} />
          <div style={{width: 90, height: 90, borderRadius: 999, background: '#2fbf5b', border: '5px solid #0b0f1a'}} />
        </div>
      </div>
    </div>
  );
};

const Bulle: React.FC<{texte: string; retard: number; queue?: number}> = ({texte, retard, queue = 210}) => {
  const frame = useCurrentFrame() - retard;
  if (frame < 0) return null;
  const s = spring({frame, fps: FPS, config: {damping: 13, stiffness: 200}});
  return (
    <div style={{position: 'absolute', left: 90, top: 640, width: 820, transform: `scale(${0.7 + 0.3 * s})`, opacity: s,
      background: '#ffe066', border: '8px solid #14161c', borderRadius: 26, padding: '24px 30px', boxShadow: '0 12px 0 rgba(0,0,0,0.45)',
      fontFamily: TITRE, fontWeight: 900, fontSize: 46, color: '#14161c', textAlign: 'center', lineHeight: 1.15}}>
      {texte}
      <div style={{position: 'absolute', bottom: -44, right: queue, width: 0, height: 0, borderLeft: '30px solid transparent',
        borderRight: '30px solid transparent', borderTop: '44px solid #14161c'}} />
    </div>
  );
};

const Fondu: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: interpolate(frame, [0, FONDU], [0, 1], {extrapolateRight: 'clamp'})}}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- scènes (une par ligne de voix)
const L = (l: number) => (l === 0 ? 0 : f(debutLigne(l)) - 4);
const R = (l: number, mot: string, scene = l) => Math.max(0, f(tMot(l, mot)) - L(scene));

type Scene = {debut: number; contenu: React.ReactNode};
const SCENES: Scene[] = [
  {debut: 0, contenu: (<><Decor nom="vestiaire" sombre={0.6} />
    <Carte perso="sofiane" titre="SOFIANE" sous="VOTRE CHOIX" x={340} y={760} angle={0} coche />
    <BadgeRouge texte="VOUS AVEZ CHOISI" y={600} retard={f(0.3)} />
    <BadgeRouge texte="MOMO A TENU PAROLE" y={1380} retard={R(0, 'momo')} /></>)},
  {debut: L(1), contenu: (<><Decor nom="terrain_soir" /><Perso nom="karim" x={500} pied={1480} />
    <BadgeRouge texte="12 JOUEURS" y={600} retard={R(1, 'douze')} />
    <BadgeRouge texte="MOMO + 4 ABSENTS" y={700} retard={R(1, 'quatre')} /></>)},
  {debut: L(2), contenu: (<><Decor nom="choix" /><Carte titre="?" x={90} y={760} angle={-5} /><Carte titre="?" x={560} y={760} angle={5} retard={5} />
    <BadgeRouge texte="C'EST ENCORE TOI QUI DÉCIDES" y={600} retard={R(2, 'toi')} /></>)},
  {debut: L(3), contenu: (<><Decor nom="terrain_soir" /><Perso nom="sofiane_maillot" x={500} pied={1500} />
    <BadgeRouge texte="CONTRE LE LEADER" y={600} retard={R(3, 'leader')} />
    <BadgeRouge texte="SOFIANE TITULAIRE" y={700} retard={R(3, 'titulaire')} /></>)},
  {debut: L(4), contenu: (<><Decor nom="terrain_soir" sombre={0.45} />
    <Score etapes={[[0, 0, 0]]} libelle="MI-TEMPS" y={760} />
    <Perso nom="karim" x={500} pied={1620} echelle={0.75} retard={6} /></>)},
  {debut: L(5), contenu: (<><Decor nom="terrain_soir" />
    <Perso nom="sofiane_maillot" x={240} versX={760} duree={R(5, 'frappe')} pied={1520} echelle={0.85} />
    <Ballon x={320} versX={850} y={1450} duree={R(5, 'frappe')} />
    <BadgeRouge texte="70E MINUTE" y={600} retard={R(5, 'soixante-dixième')} />
    <Score etapes={[[0, 0, 0], [R(5, 'but'), 1, 0]]} y={760} />
    <BadgeRouge texte="BUT !" y={1640} retard={R(5, 'but')} /></>)},
  {debut: L(6), contenu: (<><Decor nom="terrain_soir" /><Perso nom="karim" x={330} pied={1520} echelle={0.85} />
    <Perso nom="sofiane_maillot" x={760} pied={1520} echelle={0.85} retard={4} />
    <BadgeRouge texte="BUT À 17 ANS" y={600} retard={R(6, 'but')} /></>)},
  {debut: L(7), contenu: (<><Decor nom="terrain_soir" sombre={0.45} />
    <Score etapes={[[0, 1, 0], [R(7, 'égalisation'), 1, 1], [R(7, 'deux-un'), 1, 2]]} y={760} />
    <BadgeRouge texte="85E : ÉGALISATION" y={1080} retard={R(7, 'égalisation')} />
    <BadgeRouge texte="TEMPS ADDITIONNEL" y={1190} retard={R(7, 'additionnel')} />
    <Perso nom="karim" x={500} pied={1720} echelle={0.6} /></>)},
  {debut: L(8), contenu: (<><Decor nom="vestiaire" sombre={0.6} /><Classement />
    <BadgeRouge texte="4 MATCHS RESTANTS" y={600} retard={R(8, 'quatre')} /></>)},
  {debut: L(9), contenu: (<><Decor nom="choix" /><Carte titre="?" sous="UN SAUVEUR" x={90} y={760} angle={-5} />
    <Carte perso="sofiane_maillot" titre="LE GROUPE" sous="CEUX QUI RESTENT" x={560} y={760} angle={5} retard={R(9, 'confiance')} />
    <PointInterrogation y={940} /></>)},
  {debut: L(10), contenu: (<><Decor nom="vestiaire" sombre={0.45} /><Perso nom="karim" x={270} pied={1560} echelle={0.85} />
    <Appel retard={R(10, 'vibre')} /><BadgeRouge texte="BILAL" y={600} retard={R(10, 'bilal')} /></>)},
  {debut: L(11), contenu: (<><Decor nom="terrain_nuit" /><Perso nom="bilal" x={500} pied={1500} />
    <BadgeRouge texte="BILAL · 29 ANS · EX-NATIONAL" y={600} retard={R(11, 'vingt-neuf')} />
    <BadgeRouge texte="ÉCARTÉ POUR BAGARRE" y={700} retard={R(11, 'bagarre')} />
    <BadgeRouge texte="LICENCE AU CLUB" y={1580} retard={R(11, 'licence')} /></>)},
  {debut: L(12), contenu: (<><Decor nom="parking" sombre={0.35} /><Perso nom="bilal" x={700} pied={1560} echelle={0.9} />
    <Perso nom="karim" x={290} pied={1580} echelle={0.85} />
    <Bulle texte="« Si je reviens, c'est pour jouer. Pas pour chauffer le banc. »" retard={2} /></>)},
  {debut: L(13), contenu: (<><Decor nom="choix" /><Carte perso="bilal" titre="BILAL" sous="LE SAUVEUR" x={90} y={760} angle={-5} />
    <Carte perso="sofiane_maillot" titre="GROUPE" sous="CEUX QUI RESTENT" x={560} y={760} angle={5} retard={R(13, 'faire')} />
    <PointInterrogation y={940} />
    <BadgeRouge texte="KARIM DOIT CHOISIR" y={600} retard={2} />
    <BadgeRouge texte="LA SUITE À 2 000 ❤️" y={1380} retard={R(14, 'suite', 13)} /></>)},
];

// ---------------------------------------------------------------- bruitages calés sur les mots
type Son = {nom: string; a: number; vol: number};
const SONS: Son[] = [
  {nom: 'coup', a: 0.05, vol: 0.55},
  {nom: 'tic', a: 0.3, vol: 0.5},
  {nom: 'coup', a: tMot(0, 'momo'), vol: 0.4},
  {nom: 'whoosh', a: debutLigne(1) - 0.2, vol: 0.35},
  {nom: 'tic', a: tMot(1, 'douze'), vol: 0.5},
  {nom: 'whoosh', a: debutLigne(2) - 0.2, vol: 0.35},
  {nom: 'tic', a: debutLigne(2), vol: 0.5}, {nom: 'tic', a: debutLigne(2) + 0.17, vol: 0.5},
  {nom: 'foule', a: debutLigne(3) - 0.1, vol: 0.14},
  {nom: 'sifflet', a: debutLigne(4) - 0.1, vol: 0.2},
  {nom: 'foule', a: debutLigne(5), vol: 0.16},
  {nom: 'ballon', a: tMot(5, 'récupère'), vol: 0.4},
  {nom: 'ballon', a: tMot(5, 'efface'), vol: 0.4},
  {nom: 'ballon', a: tMot(5, 'deux'), vol: 0.4},
  {nom: 'ballon', a: tMot(5, 'frappe'), vol: 0.5},
  {nom: 'coup', a: tMot(5, 'but'), vol: 0.5},
  {nom: 'foule', a: tMot(5, 'but'), vol: 0.3},
  {nom: 'pop', a: tMot(6, 'but'), vol: 0.4},
  {nom: 'foule', a: debutLigne(7), vol: 0.14},
  {nom: 'coup', a: tMot(7, 'égalisation'), vol: 0.4},
  {nom: 'coup', a: tMot(7, 'deux-un'), vol: 0.55},
  {nom: 'sifflet', a: tMot(7, 'deux-un') + 0.8, vol: 0.2},
  {nom: 'porte', a: debutLigne(8) - 0.1, vol: 0.35},
  {nom: 'tic', a: tMot(9, 'sauveur'), vol: 0.5}, {nom: 'tic', a: tMot(9, 'confiance'), vol: 0.5},
  {nom: 'notif', a: tMot(10, 'vibre'), vol: 0.4}, {nom: 'notif', a: tMot(10, 'vibre') + 0.6, vol: 0.35},
  {nom: 'pop', a: tMot(10, 'bilal'), vol: 0.45},
  {nom: 'coup', a: tMot(11, 'bagarre'), vol: 0.45},
  {nom: 'moteur', a: debutLigne(12) - 0.2, vol: 0.2},
  {nom: 'coup', a: tMot(12, 'banc'), vol: 0.45},
  {nom: 'whoosh', a: debutLigne(13) - 0.2, vol: 0.35},
  {nom: 'ding', a: debutLigne(14), vol: 0.35},
];

export const CoachEp02: React.FC = () => {
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
      <Audio src={staticFile('coach/ep02_voix.wav')} />
      {SONS.map((s, k) => (
        <Sequence key={k} from={Math.max(0, f(s.a))}>
          <Audio src={staticFile(`coach/sons/${s.nom}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- couverture
export const CoachCouv02: React.FC = () => (
  <AbsoluteFill>
    <Decor nom="choix" sombre={0.1} />
    <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: PIX, fontSize: 34, color: '#bfe3ff', background: 'rgba(8,16,36,0.9)', border: `5px solid ${BLEU}`,
        borderRadius: 12, padding: '14px 26px'}}>ÉPISODE 2</div>
    </div>
    <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center', fontFamily: TITRE, fontWeight: 900, lineHeight: 0.98,
      WebkitTextStroke: '18px #0b0f1a', paintOrder: 'stroke fill', textShadow: '0 12px 0 rgba(0,0,0,0.45)'}}>
      <div style={{fontSize: 210, color: '#fff'}}>BILAL</div>
      <div style={{fontSize: 116, color: '#fff', whiteSpace: 'nowrap'}}>OU LE <span style={{color: BLEU}}>GROUPE</span> ?</div>
    </div>
    <div style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: ROUGE, color: '#fff', fontFamily: TITRE, fontWeight: 900, fontSize: 64, padding: '12px 44px', borderRadius: 999,
        border: '7px solid #0b0f1a'}}>KARIM DOIT CHOISIR</div>
    </div>
    <Img src={staticFile('coach/pixel/bilal.png')} style={{position: 'absolute', left: 40, top: 1000, width: 400, height: 556, imageRendering: 'pixelated'}} />
    <Img src={staticFile('coach/pixel/sofiane_maillot.png')} style={{position: 'absolute', right: 40, top: 1000, width: 400, height: 556, imageRendering: 'pixelated'}} />
    <Img src={staticFile('coach/pixel/karim.png')} style={{position: 'absolute', left: 290, top: 1180, width: 500, height: 694, imageRendering: 'pixelated'}} />
  </AbsoluteFill>
);
