import {loadFont as chargerAnton} from '@remotion/google-fonts/Anton';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as chargerMono} from '@remotion/google-fonts/SpaceMono';
import React from 'react';
import {AbsoluteFill, Easing, Freeze, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';

/* Briques visuelles de la longue « Ce que la police n'a PAS le droit de te faire » (style validé sur PoliceProto le 10/11/2026). */

const anton = chargerAnton('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['700', '900'], subsets: ['latin', 'latin-ext']});
const mono = chargerMono('normal', {weights: ['400', '700'], subsets: ['latin', 'latin-ext']});
export const TITRE = anton.fontFamily;
export const TEXTE = montserrat.fontFamily;
export const MONO = mono.fontFamily;

export const FPS = 30;
export const s = (x: number) => Math.round(x * FPS);
export const NUIT = '#10202C';
export const JAUNE = '#FFE14D';
export const ROUGE = '#E8343F';
export const VERT = '#3FBF7F';
export const ease = Easing.out(Easing.cubic);
export const pop = (f: number, de: number, cfg = {damping: 12, stiffness: 180}) => (f < de ? 0 : spring({frame: f - de, fps: FPS, config: cfg}));

export const Fond: React.FC<{teinte?: string}> = ({teinte}) => (
  <AbsoluteFill style={{background: NUIT}}>
    {teinte && <AbsoluteFill style={{background: `radial-gradient(ellipse at 70% 40%, ${teinte}, transparent 65%)`}} />}
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
      backgroundSize: '60px 60px'}} />
  </AbsoluteFill>
);

/** Clip dans une carte inclinée, sur fond flouté du même clip. */
export const ClipCarte: React.FC<{src: string; debut?: number; son?: boolean; fige?: number; zoom?: number; gris?: number; gauche?: number; largeur?: number; flou?: boolean}> = (
  {src, debut = 0, son = true, fige, zoom = 1, gris = 0, gauche = 90, largeur = 930, flou = true}) => {
  const contenu = (
    <AbsoluteFill>
      {flou && (
        <AbsoluteFill style={{filter: 'blur(50px) brightness(0.35)', transform: 'scale(1.4)'}}>
          <OffthreadVideo src={staticFile(src)} startFrom={s(debut)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      )}
      <div style={{position: 'absolute', left: gauche, top: 120, width: largeur, borderRadius: 22, overflow: 'hidden', border: '7px solid #fff', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        transform: `rotate(-2deg) scale(${zoom})`, transformOrigin: '40% 40%', filter: `grayscale(${gris}) contrast(${1 + gris * 0.25})`}}>
        <OffthreadVideo src={staticFile(src)} startFrom={s(debut)} muted={!son} style={{width: '100%', display: 'block'}} />
      </div>
    </AbsoluteFill>
  );
  return fige !== undefined ? <Freeze frame={s(fige)}>{contenu}</Freeze> : contenu;
};

export const Credit: React.FC<{texte: string}> = ({texte}) => (
  <div style={{position: 'absolute', left: 40, bottom: 34, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: 'rgba(255,255,255,0.85)',
    background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 6}}>{texte}</div>
);

export const Bandeau: React.FC<{texte: string}> = ({texte}) => (
  <div style={{position: 'absolute', left: 40, top: 34, display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONO, fontWeight: 700, fontSize: 24, color: '#fff',
    background: 'rgba(16,32,44,0.85)', padding: '8px 16px', borderRadius: 8, letterSpacing: 2}}>
    <span style={{background: JAUNE, color: NUIT, fontFamily: TITRE, fontSize: 26, padding: '0 10px', borderRadius: 4, letterSpacing: 1}}>§</span>{texte}
  </div>
);

/** Paroles réelles d'un clip : grand texte à droite de la carte, ou bandeau en bas. */
export const Parole: React.FC<{lignes: [number, number, string][]; droite?: boolean; haut?: number}> = ({lignes, droite = true, haut = 820}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const l = lignes.find(([a, b]) => t >= a && t < b);
  if (!l) return null;
  const e = pop(f, s(l[0]), {damping: 14, stiffness: 260});
  if (droite) {
    return (
      <div style={{position: 'absolute', left: 1110, width: 740, top: 330, transform: `translateX(${(1 - e) * 60}px)`, opacity: Math.min(1, e * 1.4)}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: JAUNE, marginBottom: 14}}>CE QU’ON ENTEND</div>
        <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 62, lineHeight: 1.12, color: '#fff', borderLeft: `10px solid ${JAUNE}`, paddingLeft: 28}}>{l[2]}</div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: haut, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${0.85 + 0.15 * e})`, maxWidth: 1300, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 54, lineHeight: 1.15, color: '#fff',
        background: 'rgba(16,32,44,0.88)', padding: '14px 30px', borderRadius: 16, borderBottom: `6px solid ${JAUNE}`}}>{l[2]}</div>
    </div>
  );
};

export const Tampon: React.FC<{texte: string; de?: number; couleur?: string; fond?: string; taille?: number; style?: React.CSSProperties}> = (
  {texte, de = 0, couleur = ROUGE, fond = 'rgba(255,255,255,0.93)', taille = 120, style}) => {
  const f = useCurrentFrame();
  const e = pop(f, de, {damping: 9, stiffness: 260});
  if (e <= 0.001) return null;
  return (
    <div style={{position: 'absolute', transform: `scale(${2.4 - 1.4 * e}) rotate(-7deg)`, opacity: Math.min(1, e * 1.5), fontFamily: TITRE, fontSize: taille, color: couleur,
      border: `12px solid ${couleur}`, borderRadius: 18, padding: '4px 36px', background: fond, letterSpacing: 2, whiteSpace: 'nowrap', ...style}}>{texte}</div>
  );
};

export const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [0, 5], [0.85, 0], {extrapolateRight: 'clamp'})}} />;
};

/** Gros titre centré (mots jaunes entre *astérisques*, \n pour couper). */
export const Gros: React.FC<{texte: string; petit?: string; taille?: number}> = ({texte, petit, taille = 120}) => {
  const f = useCurrentFrame();
  const e = pop(f, 0);
  const morceaux = texte.split('*');
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      {petit && <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: JAUNE, marginBottom: 18, opacity: e}}>{petit}</div>}
      <div style={{fontFamily: TITRE, fontSize: taille, lineHeight: 1.05, color: '#fff', textAlign: 'center', maxWidth: 1700, whiteSpace: 'pre-line',
        transform: `translateY(${(1 - e) * 50}px)`, opacity: e}}>
        {morceaux.map((m, i) => <span key={i} style={{color: i % 2 ? JAUNE : '#fff'}}>{m}</span>)}
      </div>
    </AbsoluteFill>
  );
};

/** Carte de texte de loi, qui s'écrit, avec un passage surligné (entre [[ ]]). */
export const Doc: React.FC<{reference: string; date?: string; texte: string; duree?: number; gauche?: number; largeur?: number; haut?: number; taille?: number}> = (
  {reference, date, texte, duree = 2.2, gauche = 420, largeur = 1080, haut = 200, taille = 42}) => {
  const f = useCurrentFrame();
  const plat = texte.replace(/\[\[|\]\]/g, '');
  const n = Math.floor(interpolate(f, [8, 8 + s(duree)], [0, plat.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const surl = interpolate(f, [8 + s(duree), 8 + s(duree) + 18], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const parts: {t: string; fort: boolean}[] = [];
  let reste = n;
  texte.split(/(\[\[.*?\]\])/).forEach((p) => {
    const fort = p.startsWith('[[');
    const t = p.replace(/\[\[|\]\]/g, '');
    if (reste <= 0) return;
    parts.push({t: t.slice(0, reste), fort});
    reste -= t.length;
  });
  return (
    <div style={{position: 'absolute', left: gauche, top: haut, width: largeur, background: '#f6f0e1', borderRadius: 14, padding: '38px 48px', boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
      transform: `rotate(0.8deg) translateY(${(1 - pop(f, 0)) * 600}px)`}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: '#a0302f'}}>{reference}</div>
      {date && <div style={{fontFamily: MONO, fontSize: 21, color: '#7a6f5a', marginTop: 6}}>{date}</div>}
      <div style={{fontFamily: 'Georgia, serif', fontSize: taille, lineHeight: 1.4, color: '#1b1d24', marginTop: 22}}>
        {parts.map((p, i) => p.fort
          ? <span key={i} style={{fontWeight: 700, backgroundImage: `linear-gradient(${JAUNE}, ${JAUNE})`, backgroundRepeat: 'no-repeat', backgroundSize: `${surl}% 100%`}}>{p.t}</span>
          : <span key={i}>{p.t}</span>)}
      </div>
    </div>
  );
};

/** Grand chiffre (prison, amende, durée). */
export const Chiffre: React.FC<{valeur: string; legende: string; couleur?: string}> = ({valeur, legende, couleur = JAUNE}) => {
  const f = useCurrentFrame();
  const e = pop(f, 0, {damping: 10, stiffness: 200});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: TITRE, fontSize: 280, lineHeight: 1, color: couleur, transform: `scale(${1.6 - 0.6 * e})`, opacity: Math.min(1, e * 1.5), textShadow: '0 14px 0 rgba(0,0,0,0.35)'}}>{valeur}</div>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: '#fff', marginTop: 20, opacity: pop(f, 8)}}>{legende}</div>
    </AbsoluteFill>
  );
};

/** Liste qui se coche ligne par ligne. ok : true = vert ✓, false = rouge ✕, absent = jaune §. */
export const Liste: React.FC<{titre?: string; items: {t: string; ok?: boolean}[]; pas?: number; haut?: number; taille?: number}> = ({titre, items, pas = 0.5, haut = 170, taille = 58}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 220, right: 220, top: haut}}>
      {titre && <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: JAUNE, marginBottom: 30, opacity: pop(f, 0)}}>{titre}</div>}
      {items.map((it, i) => {
        const e = pop(f, s(i * pas));
        const coul = it.ok === false ? ROUGE : it.ok === true ? VERT : JAUNE;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, marginBottom: 22, transform: `translateX(${(1 - e) * -120}px)`, opacity: Math.min(1, e * 1.5)}}>
            <div style={{flex: 'none', width: 76, height: 76, borderRadius: 16, background: coul, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TITRE, fontSize: 52, color: NUIT}}>{it.ok === false ? '✕' : it.ok === true ? '✓' : '§'}</div>
            <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: taille, color: '#fff', lineHeight: 1.1}}>{it.t}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Deux colonnes opposées (A vs B). */
export const Duel: React.FC<{a: string; b: string; titreA?: string; titreB?: string; coulA?: string; coulB?: string}> = ({a, b, titreA, titreB, coulA = ROUGE, coulB = VERT}) => {
  const f = useCurrentFrame();
  const col = (txt: string, titre: string | undefined, c: string, de: number, dx: number) => {
    const e = pop(f, de);
    return (
      <div style={{flex: 1, background: 'rgba(255,255,255,0.06)', border: `6px solid ${c}`, borderRadius: 26, padding: '40px 44px', transform: `translateX(${(1 - e) * dx}px)`, opacity: Math.min(1, e * 1.5)}}>
        {titre && <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: c, marginBottom: 18}}>{titre}</div>}
        <div style={{fontFamily: TITRE, fontSize: 72, lineHeight: 1.05, color: '#fff', whiteSpace: 'pre-line'}}>{txt}</div>
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', left: 140, right: 140, top: 230, display: 'flex', gap: 60, alignItems: 'stretch'}}>
      {col(a, titreA, coulA, 0, -300)}
      {col(b, titreB, coulB, 8, 300)}
    </div>
  );
};

/** Bulles de commentaires (illustration du débat : textes paraphrasés, aucun pseudo réel). */
export const Bulles: React.FC<{textes: string[]}> = ({textes}) => {
  const f = useCurrentFrame();
  const pos = [[180, 200, -3], [980, 320, 2], [300, 560, 1.5], [1040, 660, -2]];
  return (
    <>
      {textes.map((t, i) => {
        const e = pop(f, s(i * 0.35));
        const [x, y, r] = pos[i % pos.length];
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, maxWidth: 740, transform: `scale(${e}) rotate(${r}deg)`, background: '#fff', borderRadius: 26, padding: '20px 30px',
            boxShadow: '0 10px 0 rgba(0,0,0,0.25)', fontFamily: TEXTE, fontWeight: 900, fontSize: 44, color: '#1b1d24'}}>
            <div style={{fontFamily: MONO, fontSize: 22, color: '#8a8f99', marginBottom: 4}}>commentaire</div>{t}
          </div>
        );
      })}
    </>
  );
};

/** Pastille / étiquette. */
export const Pastille: React.FC<{texte: string; de?: number; style?: React.CSSProperties; fond?: string; couleur?: string; taille?: number}> = (
  {texte, de = 0, style, fond = JAUNE, couleur = NUIT, taille = 48}) => {
  const f = useCurrentFrame();
  const e = pop(f, de, {damping: 10, stiffness: 220});
  return (
    <div style={{position: 'absolute', transform: `scale(${e})`, background: fond, color: couleur, fontFamily: TITRE, fontSize: taille, padding: '10px 30px', borderRadius: 40,
      letterSpacing: 1, whiteSpace: 'nowrap', boxShadow: '0 8px 0 rgba(0,0,0,0.3)', ...style}}>{texte}</div>
  );
};

/** Carte de chapitre jaune (balayage). */
export const CarteChapitre: React.FC<{n: string; titre: string; sous?: string}> = ({n, titre, sous}) => {
  const f = useCurrentFrame();
  const balayage = interpolate(f, [0, 10], [-1920, 0], {easing: ease, extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Fond />
      <AbsoluteFill style={{background: JAUNE, transform: `translateX(${balayage}px)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 60}}>
        <div style={{fontFamily: TITRE, fontSize: 380, color: NUIT, lineHeight: 1, transform: `scale(${pop(f, 4)})`}}>{n}</div>
        <div style={{maxWidth: 1050, opacity: pop(f, 10)}}>
          <div style={{fontFamily: TITRE, fontSize: 100, color: NUIT, lineHeight: 1.03}}>{titre}</div>
          {sous && <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 36, color: NUIT, marginTop: 14}}>{sous}</div>}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Bouton S'abonner animé (passe à « ABONNÉ ✓ »). */
export const BoutonAbo: React.FC<{de?: number}> = ({de = 0}) => {
  const f = useCurrentFrame();
  const e = pop(f, de, {damping: 10, stiffness: 200});
  const fait = f >= de + 26;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${e})`, background: fait ? '#6b7680' : '#FF0033', color: '#fff', fontFamily: TEXTE, fontWeight: 900, fontSize: 60, padding: '20px 64px', borderRadius: 60,
        boxShadow: '0 10px 0 rgba(0,0,0,0.3)'}}>{fait ? 'ABONNÉ ✓' : 'S’ABONNER'}</div>
    </div>
  );
};
