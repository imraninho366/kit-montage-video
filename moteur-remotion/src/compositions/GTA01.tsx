import {loadFont as chargerAnton} from '@remotion/google-fonts/Anton';
import {loadFont as chargerInter} from '@remotion/google-fonts/Inter';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import plan from '../../public/gta01/plan.json';

/**
 * Chaîne GTA 6 FR — vidéo 1 « tout savoir avant de jouer ».
 * Mélange de deux styles : documentaire (images officielles Rockstar, titres sobres) et interfaces animées
 * (étoiles, chaleur, corps, argent…). Le plan vient de chaine-gta6/videos/01-tout-savoir/montage.py.
 * Rendu muet : la voix, la musique et les whooshs sont mixés ensuite.
 */
export const {fontFamily: ANTON} = chargerAnton('normal', {weights: ['400'], subsets: ['latin']});
export const {fontFamily: INTER} = chargerInter('normal', {weights: ['500', '700', '800'], subsets: ['latin']});
export const {fontFamily: MONO} = chargerMono('normal', {weights: ['500', '600'], subsets: ['latin']});

export const DUREE_GTA01 = plan.frames;
const FPS = 30;
export const NUIT = '#0D0A18', ROSE = '#FF4FA3', ORANGE = '#FFB547', CYAN = '#3EE6FF', BLANC = '#F6F2FF', GRIS = '#A79FC2';
export const VERT = '#43E08A', ROUGE = '#FF4D5E';
export const DEGRADE = `linear-gradient(95deg, ${ROSE}, ${ORANGE})`;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export type V = Record<string, any>;
export type Plan = [string, number, number];

export const useEntree = (retard = 0, raide = 120) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - retard, fps, config: {damping: 18, stiffness: raide}});
};

/* ---------- briques ---------- */

/** Un plan Rockstar : joué à vitesse réelle, ralenti s'il est plus court que la place qu'on lui donne. */
export const Rush: React.FC<{p: Plan; d: number; flou?: number; sombre?: number}> = ({p, d, flou = 0, sombre = 0}) => {
  const f = useCurrentFrame();
  const [k, a, b] = p;
  const vitesse = Math.min(1, Math.max(0.45, ((b - a) * FPS) / d));
  const s = interpolate(f, [0, d], [1.02, 1.09], clamp);
  return <AbsoluteFill style={{overflow: 'hidden', background: NUIT}}>
    <OffthreadVideo muted src={staticFile(`gta01/${k}.mp4`)} startFrom={Math.round(a * FPS)} playbackRate={vitesse}
      style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, filter: flou ? `blur(${flou}px)` : undefined}} />
    {sombre > 0 && <AbsoluteFill style={{background: `rgba(13,10,24,${sombre})`}} />}
  </AbsoluteFill>;
};

export const Credit: React.FC = () => <div style={{position: 'absolute', right: 40, bottom: 30, fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: 'rgba(246,242,255,0.55)', textTransform: 'uppercase'}}>Images : Rockstar Games</div>;

const Grain: React.FC = () => <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,79,163,0.06), transparent 40%, rgba(62,230,255,0.05))', pointerEvents: 'none'}} />;

/** Fond des cartons : rush flouté et assombri, ou nuit dégradée s'il n'y en a pas. */
export const Fond: React.FC<{bg?: Plan; d: number; children: React.ReactNode; flou?: number}> = ({bg, d, children, flou = 26}) => (
  <AbsoluteFill>
    {bg ? <Rush p={bg} d={d} flou={flou} sombre={0.62} /> : <AbsoluteFill style={{background: `radial-gradient(circle at 30% 20%, #2a1440, ${NUIT} 70%)`}} />}
    <Grain />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>{children}</AbsoluteFill>
    {bg && <Credit />}
  </AbsoluteFill>
);

export const Sur: React.FC<{children: React.ReactNode; c?: string}> = ({children, c = GRIS}) =>
  <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: c, textTransform: 'uppercase', textAlign: 'center'}}>{children}</div>;

export const Neon: React.FC<{children: React.ReactNode; taille?: number}> = ({children, taille = 190}) =>
  <div style={{fontFamily: ANTON, fontSize: taille, lineHeight: 1.05, textTransform: 'uppercase', backgroundImage: DEGRADE, WebkitBackgroundClip: 'text', color: 'transparent',
    filter: 'drop-shadow(0 0 28px rgba(255,79,163,0.45))', textAlign: 'center', padding: '0.14em 20px 0.04em'}}>{children}</div>;

export const Monte: React.FC<{r?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({r = 0, children, style}) => {
  const e = useEntree(r);
  return <div style={{opacity: e, transform: `translateY(${(1 - e) * 40}px)`, ...style}}>{children}</div>;
};

export const Panneau: React.FC<{children: React.ReactNode; w?: number; style?: React.CSSProperties}> = ({children, w = 1300, style}) =>
  <div style={{width: w, background: 'rgba(20,14,36,0.82)', border: '2px solid rgba(255,79,163,0.45)', borderRadius: 28, padding: '54px 64px',
    boxShadow: '0 0 60px rgba(255,79,163,0.18)', boxSizing: 'border-box', ...style}}>{children}</div>;

/* ---------- styles documentaire ---------- */

const Clip: React.FC<V> = ({plans, d, x, sur}) => {
  const n = plans.length, part = Math.ceil(d / n);
  return <AbsoluteFill>
    {plans.map((p: Plan, i: number) => {
      const duree = i === n - 1 ? d - i * part : part;
      return <Sequence key={i} from={i * part} durationInFrames={duree}><Rush p={p} d={duree} /></Sequence>;
    })}
    {x && <Legende x={x} sur={sur} />}
    <Credit />
  </AbsoluteFill>;
};

/** Légende posée sur un plan Rockstar : bandeau dégradé en bas, gros texte à gauche. */
export const Legende: React.FC<{x: string; sur?: string}> = ({x, sur}) => {
  const e = useEntree(3);
  return <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(13,10,24,0.88) 0%, rgba(13,10,24,0.45) 30%, transparent 55%)'}}>
    <div style={{position: 'absolute', left: 100, right: 100, bottom: 110, opacity: e, transform: `translateY(${(1 - e) * 30}px)`}}>
      {sur && <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: ORANGE, textTransform: 'uppercase', marginBottom: 14}}>{sur}</div>}
      <div style={{width: 120, height: 6, background: DEGRADE, marginBottom: 20}} />
      <div style={{fontFamily: ANTON, fontSize: x.length > 34 ? 84 : 104, color: BLANC, textTransform: 'uppercase', lineHeight: 1.05, textShadow: '0 4px 24px rgba(0,0,0,0.5)'}}>{x}</div>
    </div>
  </AbsoluteFill>;
};

const Titre: React.FC<V> = ({x, sous, bg, d}) => <Fond bg={bg} d={d}>
  <Monte><Neon taille={x.length > 14 ? 150 : 200}>{x}</Neon></Monte>
  {sous && <Monte r={6} style={{marginTop: 28}}><Sur c={BLANC}>{sous}</Sur></Monte>}
</Fond>;

const Stat: React.FC<V> = ({v, l, bg, d}) => <Fond bg={bg} d={d}>
  <Monte><Neon taille={v.length > 8 ? 170 : 260}>{v}</Neon></Monte>
  <Monte r={7} style={{marginTop: 30, maxWidth: 1400}}><Sur c={BLANC}>{l}</Sur></Monte>
</Fond>;

const Chap: React.FC<V> = ({n, x, d}) => {
  const f = useCurrentFrame();
  const ligne = interpolate(f, [0, 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const sortie = interpolate(f, [d - 8, d], [1, 0], clamp);
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 60%, #3a1550, ${NUIT} 72%)`, alignItems: 'center', justifyContent: 'center', opacity: sortie}}>
    <Monte><Sur c={ORANGE}>Chapitre {n}</Sur></Monte>
    <div style={{width: 720 * ligne, height: 4, background: DEGRADE, margin: '30px 0', boxShadow: `0 0 24px ${ROSE}`}} />
    <Monte r={5}><Neon taille={130}>{x}</Neon></Monte>
  </AbsoluteFill>;
};

const Cite: React.FC<V> = ({x, qui, fr, bg, d}) => <Fond bg={bg} d={d}>
  <Monte style={{maxWidth: 1500, textAlign: 'center'}}>
    <div style={{fontFamily: INTER, fontWeight: 800, fontSize: 76, color: BLANC, lineHeight: 1.15}}>{x}</div>
    {fr && <div style={{fontFamily: INTER, fontWeight: 500, fontSize: 44, color: ORANGE, marginTop: 26}}>{fr}</div>}
  </Monte>
  <Monte r={8} style={{marginTop: 40}}><Sur>{qui}</Sur></Monte>
</Fond>;

const Personne: React.FC<V> = ({nom, role, bg, d}) => <Fond bg={bg} d={d} flou={14}>
  <div style={{position: 'absolute', left: 120, bottom: 170}}>
    <Monte><div style={{width: 120, height: 6, background: DEGRADE, marginBottom: 22}} /></Monte>
    <Monte r={3}><div style={{fontFamily: ANTON, fontSize: 120, color: BLANC, textTransform: 'uppercase', lineHeight: 1}}>{nom}</div></Monte>
    <Monte r={8} style={{marginTop: 18}}><div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: ORANGE, textTransform: 'uppercase'}}>{role}</div></Monte>
    <Monte r={12} style={{marginTop: 12}}><div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: GRIS, textTransform: 'uppercase'}}>propos rapportés par la presse</div></Monte>
  </div>
</Fond>;

const Fiche: React.FC<V> = ({nom, desc, bg, d}) => {
  const e = useEntree(4);
  return <AbsoluteFill>
    <Rush p={bg} d={d} sombre={0.2} />
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(13,10,24,0.92) 0%, rgba(13,10,24,0.55) 38%, transparent 62%)'}} />
    <div style={{position: 'absolute', left: 110, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: `translateX(${(1 - e) * -80}px)`, opacity: e}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: ORANGE, textTransform: 'uppercase'}}>Personnage</div>
      <div style={{fontFamily: ANTON, fontSize: 150, color: BLANC, textTransform: 'uppercase', lineHeight: 1.02, marginTop: 14, maxWidth: 900}}>{nom}</div>
      <div style={{width: 160, height: 6, background: DEGRADE, margin: '26px 0'}} />
      <div style={{fontFamily: INTER, fontWeight: 700, fontSize: 46, color: BLANC, maxWidth: 760}}>{desc}</div>
    </div>
    <Credit />
  </AbsoluteFill>;
};

/* ---------- interfaces animées ---------- */

const Tuile: React.FC<{titre: string; etat: 'oui' | 'non' | 'cloud' | 'q'; r: number; note?: string}> = ({titre, etat, r, note}) => {
  const c = {oui: VERT, non: ROUGE, cloud: CYAN, q: ORANGE}[etat];
  const signe = {oui: '✓', non: '✕', cloud: '☁', q: '?'}[etat];
  return <Monte r={r} style={{width: 300, height: 320, borderRadius: 26, border: `3px solid ${c}`, background: 'rgba(20,14,36,0.85)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16, boxShadow: `0 0 36px ${c}44`}}>
    <div style={{fontFamily: ANTON, fontSize: 110, color: c, lineHeight: 1}}>{signe}</div>
    <div style={{fontFamily: INTER, fontWeight: 800, fontSize: 36, color: BLANC, textAlign: 'center'}}>{titre}</div>
    {note && <div style={{fontFamily: MONO, fontSize: 21, color: GRIS, textAlign: 'center', padding: '0 16px'}}>{note}</div>}
  </Monte>;
};

const Consoles: React.FC<V> = ({p, d}) => <Fond d={d}>
  <Sur c={ORANGE}>Le 19 novembre, ça tourne sur…</Sur>
  <div style={{display: 'flex', gap: 34, marginTop: 50}}>
    <Tuile titre="PS5" etat="oui" r={p === 0 ? 4 : -30} />
    <Tuile titre="Xbox Series" etat="oui" r={p === 0 ? 10 : -30} />
    {p >= 1 && <Tuile titre="PS4" etat="non" r={p === 1 ? 4 : -30} />}
    {p >= 2 && <Tuile titre="Xbox One" etat="cloud" note="streaming seulement" r={p === 2 ? 4 : -30} />}
    {p >= 3 && <Tuile titre="PC" etat="q" note="rien d'annoncé" r={4} />}
  </div>
</Fond>;

const Prix: React.FC<V> = ({p, d}) => {
  const carte = (nom: string, approx: string, exact: string, r: number, mis = false) => <Monte r={r}><Panneau w={600} style={{textAlign: 'center', border: `2px solid ${mis ? ORANGE : 'rgba(255,79,163,0.45)'}`}}>
    <Sur c={mis ? ORANGE : GRIS}>Édition {nom}</Sur>
    <div style={{fontFamily: ANTON, fontSize: p === 0 ? 170 : 140, color: BLANC, marginTop: 20, lineHeight: 1.05}}>{p === 0 ? approx : exact}</div>
  </Panneau></Monte>;
  return <Fond d={d}><div style={{display: 'flex', gap: 60}}>{carte('Standard', '80 €', '79,99 €', 4)}{carte('Ultimate', '100 €', '99,99 €', 12, true)}</div>
    <Monte r={20} style={{marginTop: 40}}><Sur>prix officiels en France</Sur></Monte></Fond>;
};

const Boite: React.FC<V> = ({p, d}) => {
  const f = useCurrentFrame();
  const ouvre = interpolate(f, [8, 30], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return <Fond d={d}>
    <div style={{display: 'flex', alignItems: 'center', gap: 90}}>
      <div style={{position: 'relative', width: 500, height: 620, perspective: 1600}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 18, background: '#140e22', border: '3px solid #3a2a55', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {p === 1 && <div style={{width: 340, height: 340, borderRadius: '50%', border: `6px dashed ${ROUGE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ouvre}}>
            <div style={{fontFamily: ANTON, fontSize: 200, color: ROUGE}}>✕</div></div>}
          {p === 2 && <div style={{width: 380, padding: 28, borderRadius: 14, background: BLANC, opacity: ouvre, transform: `translateY(${(1 - ouvre) * 60}px)`}}>
            <div style={{fontFamily: MONO, fontSize: 24, color: '#333'}}>CODE DE TÉLÉCHARGEMENT</div>
            <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 31, color: NUIT, marginTop: 14, letterSpacing: 2, whiteSpace: 'nowrap'}}>XXXX-XXXX-XXXX</div></div>}
        </div>
        <div style={{position: 'absolute', inset: 0, borderRadius: 18, background: `linear-gradient(160deg, ${ROSE}, #7a2bb8 55%, ${ORANGE})`, transformOrigin: 'left center',
          transform: `rotateY(${-ouvre * 115}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', backfaceVisibility: 'hidden'}}>
          <div style={{fontFamily: ANTON, fontSize: 260, color: 'rgba(255,255,255,0.92)'}}>VI</div>
        </div>
      </div>
      <Monte r={18} style={{maxWidth: 680}}>
        <Neon taille={120}>{p === 1 ? 'Pas de disque' : 'Juste un code'}</Neon>
        <div style={{marginTop: 24}}><Sur c={BLANC}>{p === 1 ? 'dans la version « physique »' : 'confirmé par Rockstar'}</Sur></div>
      </Monte>
    </div>
  </Fond>;
};

const Stockage: React.FC<V> = ({p, d}) => {
  const f = useCurrentFrame();
  const rempli = p === 0 ? 0 : p === 1 ? interpolate(f, [0, 30], [0, 212], {...clamp, easing: Easing.out(Easing.cubic)}) : 212;
  const largeur = 1400;
  return <Fond d={d}>
    <Sur c={ORANGE}>{p === 0 ? 'Le téléchargement' : p >= 2 ? 'SSD d’une PS5 standard : 825 Go' : 'Jusqu’à'}</Sur>
    <div style={{fontFamily: ANTON, fontSize: 210, color: BLANC, margin: '20px 0 40px', lineHeight: 1}}>{p === 0 ? 'Énorme' : `${Math.round(rempli)} Go`}</div>
    <div style={{position: 'relative', width: largeur, height: 70, borderRadius: 35, background: '#221735', overflow: 'hidden', border: '2px solid #3a2a55'}}>
      <div style={{width: (rempli / 825) * largeur, height: '100%', background: DEGRADE, boxShadow: `0 0 30px ${ROSE}`}} />
      {p === 3 && <div style={{position: 'absolute', left: (212 / 825) * largeur, top: 0, height: '100%', width: interpolate(f, [0, 25], [0, 90], clamp),
        background: `repeating-linear-gradient(45deg, ${ORANGE}, ${ORANGE} 12px, transparent 12px, transparent 24px)`}} />}
    </div>
    <div style={{display: 'flex', justifyContent: 'space-between', width: largeur, marginTop: 18}}>
      <Sur>{p >= 2 ? '≈ un quart du disque' : ''}</Sur><Sur>{p === 3 ? '+ patch du jour 1' : p >= 1 ? '825 Go' : ''}</Sur>
    </div>
  </Fond>;
};

const Fps: React.FC<V> = ({p, d}) => <Fond d={d}>
  <Monte><Neon taille={280}>30 FPS</Neon></Monte>
  {p >= 1 && <div style={{display: 'flex', gap: 30, marginTop: 40}}>
    {['PS5', 'Xbox Series', 'PS5 Pro'].map((x, i) => <Monte key={x} r={p === 1 ? 4 + i * 6 : -20}><Panneau w={380} style={{padding: '28px 30px', textAlign: 'center', border: x === 'PS5 Pro' ? `2px solid ${ORANGE}` : undefined}}>
      <div style={{fontFamily: INTER, fontWeight: 800, fontSize: 40, color: BLANC}}>{x}</div>
      <div style={{fontFamily: MONO, fontSize: 28, color: x === 'PS5 Pro' ? ORANGE : GRIS, marginTop: 8}}>30 images/s</div></Panneau></Monte>)}
  </div>}
  {p === 2 && <Monte r={6} style={{marginTop: 34}}><Sur c={BLANC}>PS5 Pro : image plus nette + ombres réalistes · pas plus fluide</Sur></Monte>}
</Fond>;

const Abo: React.FC<V> = ({d, sur}) => {
  const f = useCurrentFrame();
  const clic = interpolate(f, [26, 32, 38], [1, 0.92, 1], clamp);
  const fait = f > 32;
  return <Fond d={d}>
    <Monte><Sur c={ORANGE}>{sur || 'Prêt pour le 19 ?'}</Sur></Monte>
    <Monte r={6} style={{marginTop: 40, transform: `scale(${clic})`}}>
      <div style={{padding: '34px 80px', borderRadius: 60, background: fait ? '#3a2a55' : ROUGE, fontFamily: INTER, fontWeight: 800, fontSize: 64, color: BLANC, letterSpacing: 2}}>
        {fait ? 'ABONNÉ ✓' : "S'ABONNER"}</div>
    </Monte>
  </Fond>;
};

const Sources: React.FC<V> = ({s1, s2, s3, d}) => <Fond d={d}>
  <Sur c={ORANGE}>Ce que j’ai épluché</Sur>
  <div style={{display: 'flex', gap: 26, marginTop: 44}}>
    {[[s1, 'Trailer 1'], [s2, 'Trailer 2'], [s3, 'Launch Trailer']].map(([p, l], i) => <Monte key={l as string} r={4 + i * 5}>
      <div style={{width: 470, height: 264, borderRadius: 18, overflow: 'hidden', border: '2px solid rgba(255,79,163,0.5)', position: 'relative'}}>
        <Rush p={p as Plan} d={d} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 16px', background: 'rgba(13,10,24,0.8)', fontFamily: INTER, fontWeight: 700, fontSize: 30, color: BLANC}}>{l}</div>
      </div></Monte>)}
  </div>
  <Monte r={22} style={{marginTop: 40}}><Sur c={BLANC}>+ interviews : Game Informer · Dazed · IGN</Sur></Monte>
</Fond>;

const REGIONS = ['Vice City', 'Leonida Keys', 'Grassrivers', 'Port Gellhorn', 'Ambrosia', 'Mount Kalaga'];
const PHRASES = ['plages, Art déco, port de croisière', 'îles tropicales', 'mangroves et prédateurs', 'station balnéaire en déclin', 'raffinerie de sucre, motards', 'parc national, au nord'];
const Regions: React.FC<V> = ({r, clip, d}) => <AbsoluteFill style={{background: NUIT}}>
  {clip ? <Rush p={clip} d={d} /> : <AbsoluteFill style={{background: `radial-gradient(circle at 70% 40%, #1d3a2a, ${NUIT} 70%)`}} />}
  <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(13,10,24,0.94) 0%, rgba(13,10,24,0.7) 34%, transparent 58%)'}} />
  <div style={{position: 'absolute', left: 100, top: 120}}>
    <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: ORANGE, textTransform: 'uppercase'}}>Leonida · 6 régions</div>
    <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 12}}>
      {REGIONS.map((x, i) => {
        const actif = r === i, tout = r === -1;
        return <Monte key={x} r={tout ? i * 5 : 0}><div style={{display: 'flex', alignItems: 'center', gap: 20, opacity: tout || actif ? 1 : 0.35}}>
          <div style={{width: 18, height: 18, borderRadius: 9, background: actif ? ROSE : GRIS, boxShadow: actif ? `0 0 18px ${ROSE}` : undefined}} />
          <div style={{fontFamily: ANTON, fontSize: actif ? 88 : 58, color: BLANC, textTransform: 'uppercase', lineHeight: 1.05}}>{x}</div>
        </div>{actif && <div style={{marginLeft: 38, marginTop: 4, fontFamily: MONO, fontWeight: 600, fontSize: 28, letterSpacing: 3, color: BLANC, textTransform: 'uppercase'}}>{PHRASES[i]}</div>}</Monte>;
      })}
    </div>
  </div>
  {clip && <Credit />}
</AbsoluteFill>;

export const COULEURS_VERDICT: Record<string, string> = {'ESTIMATION': ORANGE, 'ESTIMATION FRAGILE': ORANGE, 'OFFICIEL': VERT, 'FAUX': ROUGE, 'VRAI': VERT, 'PAS CONFIRMÉ': ORANGE, 'À MOITIÉ VRAI': '#FFE14D', 'RUMEUR': ORANGE};
const Vf: React.FC<V> = ({c, v, note, d}) => {
  const f = useCurrentFrame();
  const coup = interpolate(f, [2, 9], [2.4, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const col = COULEURS_VERDICT[v] ?? ORANGE;
  return <Fond d={d}>
    <Panneau w={1450} style={{textAlign: 'center', padding: '80px 70px'}}>
      <Sur>Rumeur</Sur>
      <div style={{fontFamily: INTER, fontWeight: 800, fontSize: c.length > 30 ? 66 : 84, color: BLANC, marginTop: 24, lineHeight: 1.15}}>{`«\u00a0${c}\u00a0»`}</div>
      {v && <div style={{marginTop: 46, display: 'inline-block', padding: '14px 46px', border: `7px solid ${col}`, borderRadius: 14, transform: `rotate(-4deg) scale(${coup})`,
        fontFamily: ANTON, fontSize: 104, color: col, letterSpacing: 4}}>{v}</div>}
      {v && note && <Monte r={10} style={{marginTop: 30}}><Sur c={BLANC}>{note}</Sur></Monte>}
    </Panneau>
  </Fond>;
};

const Switch: React.FC<V> = ({p, d}) => {
  const f = useCurrentFrame();
  const va = Math.sin(f / 8) * 30;
  const carte = (x: string, c: string) => <Panneau w={480} style={{textAlign: 'center', border: `3px solid ${c}`}}>
    <div style={{fontFamily: ANTON, fontSize: 140, color: BLANC, lineHeight: 1}}>{x}</div></Panneau>;
  return <Fond d={d}>
    <div style={{display: 'flex', alignItems: 'center', gap: 60}}>
      {carte('Jason', CYAN)}
      <div style={{fontFamily: ANTON, fontSize: 150, color: p === 1 ? ROUGE : ORANGE, transform: p === 0 ? `translateX(${va}px)` : undefined}}>{p === 1 ? '✕' : '⇄'}</div>
      {carte('Lucia', ROSE)}
    </div>
    <Monte r={8} style={{marginTop: 50}}><Sur c={BLANC}>{['même en pleine mission', 'pas n’importe quand', 'certaines missions imposent un personnage'][p]}</Sur></Monte>
  </Fond>;
};

const Relation: React.FC<V> = ({d}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, d * 0.35, d * 0.7, d], [0.5, 0.78, 0.4, 0.66], clamp);
  return <Fond d={d}>
    <Sur c={ORANGE}>Relation Jason – Lucia</Sur>
    <div style={{position: 'relative', width: 1300, height: 26, borderRadius: 13, background: `linear-gradient(90deg, ${ROUGE}, #3a2a55, ${VERT})`, marginTop: 60}}>
      <div style={{position: 'absolute', left: x * 1300 - 26, top: -26, width: 52, height: 78, borderRadius: 14, background: BLANC, boxShadow: `0 0 30px ${BLANC}`}} />
    </div>
    <div style={{display: 'flex', justifyContent: 'space-between', width: 1300, marginTop: 30}}><Sur>tensions</Sur><Sur>confiance</Sur></div>
    <Monte r={10} style={{marginTop: 50}}><Sur c={BLANC}>tes choix pèsent plus que l’honneur de Red Dead 2</Sur></Monte>
  </Fond>;
};

const Compare: React.FC<V> = ({p, d}) => {
  const f = useCurrentFrame();
  const chrono = Math.min(30, Math.floor(f / 3));
  return <Fond d={d}>
    <div style={{display: 'flex', gap: 60}}>
      <Panneau w={680} style={{textAlign: 'center'}}>
        <Sur>GTA 5</Sur>
        <div style={{fontFamily: ANTON, fontSize: 170, color: BLANC, lineHeight: 1.05, marginTop: 16}}>{p === 0 ? `${chrono} s` : '30 s'}</div>
        <Sur c={VERT}>caché derrière un mur → semé</Sur>
      </Panneau>
      <Panneau w={680} style={{textAlign: 'center', opacity: p === 1 ? 1 : 0.25, border: `2px solid ${p === 1 ? ROUGE : 'rgba(255,79,163,0.45)'}`}}>
        <Sur>GTA 6</Sur>
        <div style={{fontFamily: ANTON, fontSize: 170, color: p === 1 ? ROUGE : BLANC, lineHeight: 1.05, marginTop: 16}}>{p === 1 ? 'Oublie' : '?'}</div>
        <Sur c={ROUGE}>{p === 1 ? 'la police se souvient' : ' '}</Sur>
      </Panneau>
    </div>
  </Fond>;
};

const Etoiles: React.FC<V> = ({p, d}) => {
  const f = useCurrentFrame();
  const n = p === 0 ? Math.min(6, Math.floor(f / 7) + 1) : 6;
  const chaleur = interpolate(f, [6, 40], [0, 0.82], clamp);
  return <Fond d={d}>
    <div style={{display: 'flex', gap: 26}}>
      {Array.from({length: 6}, (_, i) => <div key={i} style={{fontSize: 170, lineHeight: 1, color: i < n ? ORANGE : '#2c2240', textShadow: i < n ? `0 0 30px ${ORANGE}` : undefined}}>★</div>)}
    </div>
    {p === 1 ? <div style={{marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Sur c={ROSE}>Nouveau : la « chaleur »</Sur>
      <div style={{width: 1100, height: 34, borderRadius: 17, background: '#221735', marginTop: 24, overflow: 'hidden'}}>
        <div style={{width: `${chaleur * 100}%`, height: '100%', background: `linear-gradient(90deg, ${ORANGE}, ${ROUGE})`, boxShadow: `0 0 26px ${ROUGE}`}} /></div>
    </div> : <Monte r={30} style={{marginTop: 40}}><Sur c={BLANC}>6 étoiles de recherche</Sur></Monte>}
  </Fond>;
};

const Chaleur: React.FC<V> = ({p, d}) => {
  const f = useCurrentFrame();
  const niveau = p === 2 ? interpolate(f, [20, 60], [0.85, 0.15], clamp) : 0.85;
  const lignes = [['Visage', 'mémorisé'], ['Tenue', p === 2 ? 'changée' : 'mémorisée'], ['Dernier lieu', 'signalé']];
  return <Fond d={d}>
    <div style={{display: 'flex', gap: 70, alignItems: 'center'}}>
      <Panneau w={900}>
        <Sur c={ROUGE}>Signalement · police de Leonida</Sur>
        {lignes.map(([a, b], i) => {
          const tenue = a === 'Tenue';
          const col = tenue && p === 2 ? VERT : tenue && p === 1 ? ROUGE : BLANC;
          return <Monte key={a} r={p === 0 ? 6 + i * 8 : 0}><div style={{display: 'flex', justifyContent: 'space-between', marginTop: 34, paddingBottom: 18, borderBottom: '2px solid #3a2a55'}}>
            <div style={{fontFamily: INTER, fontWeight: 800, fontSize: 54, color: col, textDecoration: tenue && p === 2 ? 'line-through' : undefined}}>{a}</div>
            <div style={{fontFamily: MONO, fontSize: 34, color: col, alignSelf: 'center'}}>{b}</div></div></Monte>;
        })}
      </Panneau>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{width: 70, height: 460, borderRadius: 35, background: '#221735', position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', bottom: 0, width: '100%', height: `${niveau * 100}%`, background: `linear-gradient(0deg, ${ORANGE}, ${ROUGE})`}} /></div>
        <div style={{marginTop: 20}}><Sur c={ROUGE}>chaleur</Sur></div>
      </div>
    </div>
    {p === 1 && <Monte r={10} style={{marginTop: 40}}><Sur c={BLANC}>même tenue = toujours une cible</Sur></Monte>}
  </Fond>;
};

const Braquage: React.FC<V> = ({d}) => <Fond d={d}>
  <Monte><Panneau w={560} style={{textAlign: 'center', padding: '30px 40px'}}><div style={{fontFamily: ANTON, fontSize: 90, color: BLANC}}>Braquage</div></Panneau></Monte>
  <div style={{display: 'flex', gap: 40, marginTop: 70}}>
    {[['L’employé obéit', VERT], ['Il appelle la police', ROUGE], ['Un témoin voit tout', ORANGE]].map(([x, c], i) => <Monte key={x} r={14 + i * 10}>
      <Panneau w={520} style={{textAlign: 'center', border: `3px solid ${c}`, padding: '40px 24px'}}>
        <div style={{fontFamily: INTER, fontWeight: 800, fontSize: 42, color: BLANC, whiteSpace: 'nowrap'}}>{x}</div></Panneau></Monte>)}
  </div>
  <Monte r={50} style={{marginTop: 40}}><Sur>d’après les journalistes qui ont vu le jeu tourner</Sur></Monte>
</Fond>;

const Argent: React.FC<V> = ({p, d}) => {
  const f = useCurrentFrame();
  const montant = p === 2 ? interpolate(f, [0, d], [0, 48000], clamp)
    : p === 1 ? 2_000_000_000 : interpolate(f, [0, Math.min(d, 60)], [0, 2_000_000_000], {...clamp, easing: Easing.in(Easing.quad)});
  const txt = '$' + Math.round(montant).toLocaleString('en-US');
  return <Fond d={d}>
    <Sur c={ORANGE}>{p === 2 ? 'GTA 6' : 'GTA 5 · fin de l’histoire'}</Sur>
    <div style={{fontFamily: ANTON, fontSize: 190, color: p === 2 ? VERT : BLANC, marginTop: 20, lineHeight: 1}}>{txt}</div>
    <Monte r={20} style={{marginTop: 30}}><Sur c={BLANC}>{p === 2 ? 'plus dur à gagner · plus utile à dépenser' : 'et plus rien d’intéressant à acheter'}</Sur></Monte>
    {p === 1 && <div style={{position: 'absolute', transform: `rotate(-8deg) scale(${interpolate(f, [4, 11], [2.2, 1], clamp)})`, padding: '16px 50px', border: `8px solid ${ROUGE}`, borderRadius: 16,
      fontFamily: ANTON, fontSize: 120, color: ROUGE, background: 'rgba(13,10,24,0.7)'}}>UNE ERREUR</div>}
    {p === 0 && <Monte r={40} style={{position: 'absolute', bottom: 90}}><Sur>montant illustratif</Sur></Monte>}
  </Fond>;
};

/** Silhouette simple : épaules et ventre varient avec le sport et la nourriture. */
const Figure: React.FC<{epaules?: number; ventre?: number; fantome?: boolean}> = ({epaules = 1, ventre = 1, fantome = false}) => {
  const id = fantome ? 'gf' : 'gc';
  const remp = `url(#${id})`;
  return <svg width={380} height={620} viewBox="0 0 460 620" style={{opacity: fantome ? 0.35 : 1}}>
    <defs><linearGradient id={id} x1="0" x2="1">{fantome
      ? <><stop offset="0" stopColor={GRIS} /><stop offset="1" stopColor={GRIS} /></>
      : <><stop offset="0" stopColor={ROSE} /><stop offset="1" stopColor={ORANGE} /></>}</linearGradient></defs>
    <circle cx={230} cy={80} r={58} fill={remp} />
    <path d={`M ${230 - 95 * epaules} 170 Q 230 140 ${230 + 95 * epaules} 170 L ${230 + 70 * ventre} 380 Q 230 ${400 + 40 * (ventre - 1)} ${230 - 70 * ventre} 380 Z`} fill={remp} />
    {ventre > 1 && <ellipse cx={230} cy={318} rx={70 * ventre} ry={62 + 30 * (ventre - 1)} fill={remp} />}
    <rect x={230 - 68} y={385} width={56} height={220} rx={26} fill={remp} />
    <rect x={230 + 12} y={385} width={56} height={220} rx={26} fill={remp} />
    <rect x={230 - 95 * epaules - 44 * epaules} y={178} width={44 * epaules} height={200} rx={22} fill={remp} />
    <rect x={230 + 95 * epaules} y={178} width={44 * epaules} height={200} rx={22} fill={remp} />
  </svg>;
};

const Corps: React.FC<V> = ({p, d}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [6, 36], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const energie = p === 3 ? interpolate(f, [0, d], [0.9, 0.18], clamp) : 0.9;
  const etiquette = ['ton personnage', '+ salle de sport = muscle', '+ malbouffe = poids', 'sommeil · poursuites · fêtes'][p];
  const avantApres = p === 1 || p === 2;
  return <Fond d={d}>
    <div style={{display: 'flex', alignItems: 'center', gap: 90}}>
      {avantApres ? <div style={{display: 'flex', alignItems: 'flex-end', gap: 30}}>
        <div style={{textAlign: 'center'}}><Figure fantome /><Sur>avant</Sur></div>
        <div style={{fontFamily: ANTON, fontSize: 90, color: ORANGE, alignSelf: 'center'}}>→</div>
        <div style={{textAlign: 'center'}}><Figure epaules={p === 1 ? 1 + 0.32 * k : 1} ventre={p === 2 ? 1 + 0.7 * k : 1} /><Sur c={BLANC}>après</Sur></div>
      </div> : <Figure />}
      <div>
        <Monte><Neon taille={110}>{p === 3 ? 'Usure' : 'Ton corps'}</Neon></Monte>
        <Monte r={8} style={{marginTop: 26}}><Sur c={BLANC}>{etiquette}</Sur></Monte>
        {p === 3 && <div style={{width: 560, height: 30, borderRadius: 15, background: '#221735', marginTop: 40, overflow: 'hidden'}}>
          <div style={{width: `${energie * 100}%`, height: '100%', background: energie > 0.4 ? VERT : ROUGE}} /></div>}
      </div>
    </div>
  </Fond>;
};

const Liste: React.FC<V> = ({titre, items, k, bg, d}) => <Fond bg={bg} d={d}>
  <Panneau w={1250}>
    <Sur c={ORANGE}>{titre}</Sur>
    {items.map((x: string, i: number) => {
      const actif = i + 1 === k && k < items.length + (items.length <= 3 ? 0 : 1) && !(items.length <= 3);
      const fait = items.length <= 3 ? true : i + 1 < k;
      const visible = k === 0 || actif || fait;
      return <Monte key={x} r={k === 0 || items.length <= 3 ? 5 + i * 7 : 0}>
        <div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 26, opacity: visible ? 1 : 0.35}}>
          <div style={{width: 70, height: 70, borderRadius: 16, background: actif ? DEGRADE : '#2a1f40', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: ANTON, fontSize: 44, color: BLANC, flexShrink: 0}}>{fait && !actif && items.length > 3 ? '✓' : i + 1}</div>
          <div style={{fontFamily: INTER, fontWeight: 800, fontSize: actif ? 62 : 52, color: BLANC}}>{x}</div>
        </div></Monte>;
    })}
  </Panneau>
</Fond>;

const Compteur: React.FC<V> = ({v, suffixe, l, bg, d}) => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [0, Math.min(45, d - 10)], [0, v], {...clamp, easing: Easing.out(Easing.cubic)}));
  return <Fond bg={bg} d={d}>
    <Neon taille={300}>{`${!suffixe ? '+' : ''}${n}${suffixe}`}</Neon>
    <Monte r={10} style={{marginTop: 26}}><Sur c={BLANC}>{l}</Sur></Monte>
  </Fond>;
};

const Faune: React.FC<V> = ({d}) => <Fond d={d}>
  <div style={{display: 'flex', gap: 80}}>
    {[['60+', 'oiseaux'], ['30+', 'mammifères terrestres']].map(([a, b], i) => <Monte key={b} r={4 + i * 12} style={{textAlign: 'center'}}>
      <Neon taille={240}>{a}</Neon><div style={{marginTop: 20}}><Sur c={BLANC}>{b}</Sur></div></Monte>)}
  </div>
</Fond>;

const Rarete: React.FC<V> = ({d}) => <Fond d={d}>
  <div style={{display: 'flex', gap: 40}}>
    {[['Rare', CYAN], ['Découvrable', VERT], ['Légendaire', ORANGE]].map(([x, c], i) => <Monte key={x} r={4 + i * 10}>
      <Panneau w={480} style={{textAlign: 'center', border: `3px solid ${c}`, boxShadow: `0 0 50px ${c}55`, padding: '54px 30px'}}>
        <div style={{fontFamily: ANTON, fontSize: 88, color: c}}>{x}</div></Panneau></Monte>)}
  </div>
  <Monte r={36} style={{marginTop: 40}}><Sur c={BLANC}>et certains se pistent</Sur></Monte>
</Fond>;

/** Pluie dessinée, pour illustrer le côté « mangroves » (aucun plan de pluie dans les trailers). */
const Pluie: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(105deg, rgba(200,220,255,0.0) 0px, rgba(200,220,255,0.0) 14px, rgba(200,220,255,0.35) 15px, rgba(200,220,255,0.0) 17px)',
    backgroundSize: '100% 180px', backgroundPosition: `${-f * 4}px ${f * 38}px`, mixBlendMode: 'screen'}} />;
};

const Meteo: React.FC<V> = ({g, dr, d}) => <AbsoluteFill style={{flexDirection: 'row'}}>
  {[[g, 'Soleil sur Vice City'], [dr, 'Pluie dans les mangroves']].map(([p, x], i) => <div key={i} style={{flex: 1, position: 'relative', overflow: 'hidden'}}>
    <Rush p={p as Plan} d={d} sombre={i === 1 ? 0.45 : 0.1} />
    {i === 1 && <Pluie />}
    <div style={{position: 'absolute', left: 50, bottom: 80, right: 40}}><Monte r={i * 8}><div style={{fontFamily: ANTON, fontSize: 84, color: BLANC, lineHeight: 1.05, textShadow: '0 4px 20px rgba(0,0,0,0.6)', textTransform: 'uppercase'}}>{x as string}</div></Monte></div>
  </div>)}
  <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 6, background: DEGRADE, transform: 'translateX(-3px)'}} />
  <div style={{position: 'absolute', top: 60, width: '100%'}}><Sur c={BLANC}>au même moment</Sur></div>
  <Credit />
</AbsoluteFill>;

export const VISUELS: Record<string, React.FC<V>> = {
  clip: Clip, titre: Titre, stat: Stat, chap: Chap, cite: Cite, personne: Personne, fiche: Fiche, consoles: Consoles, prix: Prix, boite: Boite,
  stockage: Stockage, fps: Fps, abo: Abo, sources: Sources, regions: Regions, vf: Vf, switch: Switch, relation: Relation, compare: Compare,
  etoiles: Etoiles, chaleur: Chaleur, braquage: Braquage, argent: Argent, corps: Corps, liste: Liste, compteur: Compteur, faune: Faune,
  rarete: Rarete, meteo: Meteo,
};

const FONDU = 7;
export const Beat: React.FC<{v: V; d: number; premier?: boolean; extra?: Record<string, React.FC<V>>}> = ({v, d, premier, extra}) => {
  const f = useCurrentFrame();
  const Comp = extra?.[v.t] ?? VISUELS[v.t];
  const o = premier ? 1 : interpolate(f, [0, FONDU], [0, 1], clamp);
  return <AbsoluteFill style={{opacity: o}}>{Comp ? <Comp {...v} d={d} /> : <Fond d={d}><Sur c={ROUGE}>{`visuel inconnu : ${v.t}`}</Sur></Fond>}</AbsoluteFill>;
};

export const GTA01: React.FC = () => (
  <AbsoluteFill style={{background: NUIT}}>
    {(plan.beats as {d: number; f: number; v: V}[]).map((b, i) => {
      const d = b.f - b.d + (i < plan.beats.length - 1 ? FONDU : 0);
      return <Sequence key={i} from={b.d} durationInFrames={d}><Beat v={b.v} d={d} premier={i === 0} /></Sequence>;
    })}
  </AbsoluteFill>
);
