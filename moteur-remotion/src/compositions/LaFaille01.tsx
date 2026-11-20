import {loadFont as chargerSerif} from '@remotion/google-fonts/Newsreader';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {ThreeCanvas} from '@remotion/three';
import {createContext, useContext, useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import plan from '../../public/lafaille01/plan.json';
import {Camera, Carte, Chrono, CouloirFond, Etiquette, Porte, Reflets, Salle, Silhouette, Tampon} from './BinanceAccroche';

/** La Faille 01 : le montage complet, piloté par plan.json (un visuel par phrase de la voix). */
const {fontFamily: SERIF} = chargerSerif('normal', {weights: ['500'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['400', '600'], subsets: ['latin']});

const PAPIER = '#EFE9DC', ENCRE = '#1A1A1C', ROUGE = '#D22B1F', OR = '#E0A92E', CLAIR = '#F6F2E9', DOUX = '#C9C4B8', GRIS = '#57534b';
export const DossierCtx = createContext('lafaille01');
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type V = Record<string, any>;
export const DUREE_LAFAILLE01 = plan.frames;

export const Fond: React.FC<{f?: string; children: React.ReactNode}> = ({f = 'noir', children}) => {
  const bg = f === 'papier' ? 'radial-gradient(ellipse, #F4EFE4 0%, #DDD6C6 100%)'
    : f === 'gris' ? 'radial-gradient(ellipse, #CBD1D8 0%, #9BA3AD 100%)'
    : 'radial-gradient(ellipse, #26282E 0%, #08090B 78%)';
  return <AbsoluteFill style={{background: bg, justifyContent: 'center', alignItems: 'center'}}>{children}</AbsoluteFill>;
};
const encre = (f?: string) => (f === 'noir' || !f ? CLAIR : ENCRE);

/** Mouvement lent sur tout plan 2D : jamais d'image fixe, le sens alterne d'un plan à l'autre. */
export const Vie: React.FC<{i: number; d: number; children: React.ReactNode}> = ({i, d, children}) => {
  const f = useCurrentFrame();
  const a = i % 2 === 0 ? [1, 1.035] : [1.035, 1];
  const x = i % 3 === 0 ? 0 : (i % 3 === 1 ? 1 : -1) * interpolate(f, [0, d], [0, 12], clamp);
  return <AbsoluteFill style={{transform: `scale(${interpolate(f, [0, d], a, clamp)}) translateX(${x}px)`}}>{children}</AbsoluteFill>;
};
export const Entre: React.FC<{a?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({a = 0, children, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - a, fps, config: {damping: 22, stiffness: 120}});
  return <div style={{opacity: s, transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`, ...style}}>{children}</div>;
};
export const Feuille: React.FC<{w?: number; children: React.ReactNode; rot?: number; style?: React.CSSProperties}> = ({w = 1240, children, rot = -0.8, style}) => (
  <div style={{position: 'relative', width: w, background: PAPIER, color: ENCRE, padding: '56px 70px', boxSizing: 'border-box', transform: `rotate(${rot}deg)`, boxShadow: '0 30px 80px rgba(0,0,0,.55)', ...style}}>{children}</div>
);
export const Sur: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontFamily: MONO, fontSize: 25, letterSpacing: 3, color: GRIS, textTransform: 'uppercase', marginBottom: 34}}>{children}</div>;

const Titre: React.FC<V> = ({x, sous, fond}) => (
  <Fond f={fond}><div style={{textAlign: 'center', maxWidth: 1500}}>
    <Entre><div style={{fontFamily: SERIF, fontWeight: 500, fontSize: x.length > 20 ? 104 : 136, color: encre(fond), lineHeight: 1.08}}>{x}</div></Entre>
    {sous ? <Entre a={7}><div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 2, color: fond === 'noir' ? DOUX : GRIS, marginTop: 26}}>{sous}</div></Entre> : null}
  </div></Fond>
);
const Stat: React.FC<V> = ({v, l, tampon, fond}) => (
  <Fond>
    {fond === 'noir'
      ? <div style={{textAlign: 'center'}}><Entre><div style={{fontFamily: SERIF, fontSize: 190, color: CLAIR, fontVariantNumeric: 'tabular-nums'}}>{v}</div></Entre><Entre a={7}><div style={{fontFamily: MONO, fontSize: 30, color: DOUX, marginTop: 10}}>{l}</div></Entre></div>
      : <Feuille><Entre><div style={{fontFamily: SERIF, fontSize: 158, lineHeight: 1.05}}>{v}</div></Entre><Entre a={7}><div style={{fontFamily: MONO, fontSize: 30, color: GRIS, marginTop: 18}}>{l}</div></Entre>{tampon ? <Tampon a={14} texte={tampon} taille={44} style={{right: 60, bottom: 50}} /> : null}</Feuille>}
  </Fond>
);
const Heure: React.FC<V> = ({h, s}) => {
  const f = useCurrentFrame();
  return <Fond><div style={{textAlign: 'center'}}>
    <div style={{fontFamily: MONO, fontWeight: 600, fontSize: h.length > 5 ? 190 : 230, color: OR, opacity: interpolate(f, [0, 3, 5, 7], [0, 1, 0.6, 1], clamp), textShadow: `0 0 40px ${OR}55`}}>{h}</div>
    <Entre a={6}><div style={{fontFamily: MONO, fontSize: 30, color: DOUX, letterSpacing: 2}}>{s}</div></Entre>
  </div></Fond>;
};
const Cit: React.FC<V> = ({x, qui}) => <Fond><div style={{maxWidth: 1400, textAlign: 'center'}}>
  <Entre><div style={{fontFamily: SERIF, fontSize: 88, color: CLAIR, lineHeight: 1.18}}>« {x} »</div></Entre>
  <Entre a={8}><div style={{fontFamily: MONO, fontSize: 27, color: DOUX, marginTop: 34}}>{qui}</div></Entre>
</div></Fond>;
const Gel: React.FC<V> = ({n, m, h}) => <Fond><Feuille w={1120}>
  <Sur>{h} · heure de Paris</Sur>
  <Entre><div style={{fontFamily: SERIF, fontSize: 112}}>{n}</div></Entre>
  <Entre a={5}><div style={{fontFamily: MONO, fontSize: 44, marginTop: 10}}>{m}</div></Entre>
  <Tampon a={14} texte="GELÉ" taille={84} style={{right: 70, bottom: 50}} />
</Feuille></Fond>;
const Liste: React.FC<V> = ({tt, e}) => <Fond f="gris"><Feuille>
  <Sur>{tt}</Sur>
  {e.map((x: string, i: number) => <Entre key={x} a={i * 9}><div style={{fontFamily: SERIF, fontSize: 66, padding: '14px 0', borderTop: i ? '1px solid #bdb6a6' : undefined}}><span style={{color: ROUGE, fontFamily: MONO, fontSize: 30, marginRight: 26}}>{String(i + 1).padStart(2, '0')}</span>{x}</div></Entre>)}
</Feuille></Fond>;
const Barres: React.FC<V> = ({tt, r}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [2, 20], [0, 1], {easing: Easing.out(Easing.cubic), ...clamp});
  const m = Math.max(...r.map((x: any[]) => x[1]));
  return <Fond><Feuille w={1380}>
    <Sur>{tt}</Sur>
    {r.map(([n, v, l, c]: any[]) => <div key={n} style={{marginBottom: 34}}>
      <div style={{fontFamily: MONO, fontSize: 24, color: GRIS, marginBottom: 10}}>{n}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
        <div style={{height: 62, width: Math.max(8, (v / m) * 880) * a, background: c === 'r' ? ROUGE : ENCRE}} />
        <div style={{fontFamily: SERIF, fontSize: 56, opacity: a}}>{l}</div>
      </div>
    </div>)}
  </Feuille></Fond>;
};
/** Vrai extrait télé, muet, encadré et crédité. Reste assez longtemps pour lire le bandeau. */
const Tele: React.FC<V> = ({c, s, d}) => {
  const f = useCurrentFrame();
  const dos = useContext(DossierCtx);
  return <Fond>
    <Etiquette>ARCHIVE · {String(s).toUpperCase()}</Etiquette>
    <div style={{width: 1480, height: 832, border: `12px solid ${CLAIR}`, transform: `rotate(-0.8deg) scale(${interpolate(f, [0, d], [1, 1.025], clamp)})`, boxShadow: '0 40px 90px rgba(0,0,0,.8)', overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile(`${dos}/tv/x_${c}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </div>
  </Fond>;
};
export const TAILLES: Record<string, [number, number]> = {next: [1500, 1050], cointelegraph: [1500, 860], cryptoast: [1100, 560], eip: [1100, 560], euronews: [1500, 720], trm: [1500, 830], protos: [1500, 880], tweet_binance: [570, 880], tweet_ardoino: [570, 380], chainalysis: [1500, 490], coindesk: [1500, 330], doj: [1100, 830], wiki_cz: [1200, 1050], forbesbe: [1050, 750], france_epargne: [1200, 850], bitcoinmag: [1000, 760], cryptonews: [1100, 680]};
/** Vraie capture d'article ou de tweet, avec sa source. Jamais une interface recréée. */
const Article: React.FC<V> = ({img, src, d, i}) => {
  const f = useCurrentFrame();
  const dos = useContext(DossierCtx);
  const [w, h] = TAILLES[img];
  const k = Math.min(1560 / w, 900 / h);
  return <Fond>
    <Etiquette>SOURCE · {String(src).toUpperCase()}</Etiquette>
    <div style={{width: w * k, height: h * k, overflow: 'hidden', border: `8px solid ${CLAIR}`, transform: `rotate(${i % 2 ? -0.7 : 0.7}deg) scale(${interpolate(f, [0, d], [1, 1.05], clamp)})`, boxShadow: '0 40px 90px rgba(0,0,0,.8)', background: '#fff'}}>
      <Img src={staticFile(`${dos}/cap/c_${img}.png`)} style={{width: w * k, height: h * k}} />
    </div>
  </Fond>;
};
const Reseaux: React.FC<V> = ({n}) => {
  const tous = ['XRP', 'Solana', 'Optimism', 'Bitcoin', 'Tron', 'Ethereum', 'Arbitrum', 'Base', 'Avalanche', 'Polygon'];
  return <Fond><div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 290px)', gap: 24}}>
    {tous.map((x) => {
      const o = n.indexOf(x);
      return <Entre key={x} a={o < 0 ? 0 : Math.max(0, o - n.length + 4) * 5}><div style={{height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 32, color: o >= 0 ? CLAIR : '#4d5057', background: o >= 0 ? ROUGE : '#16181c', border: `2px solid ${o >= 0 ? ROUGE : '#2a2d33'}`}}>{x}</div></Entre>;
    })}
  </div></Fond>;
};
const Chap: React.FC<V> = ({n, x}) => <Fond f="papier"><div style={{textAlign: 'center'}}>
  <Entre><div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: ROUGE}}>PARTIE {n}</div></Entre>
  <Entre a={5}><div style={{fontFamily: SERIF, fontSize: 138, color: ENCRE, marginTop: 14}}>{x}</div></Entre>
</div></Fond>;
const Deux: React.FC<V> = ({g, gs, d: dr, ds}) => <Fond f="papier"><div style={{display: 'flex', gap: 50}}>
  {[[g, gs, 0], [dr, ds, 9]].map(([a, b, r]) => <Entre key={String(a)} a={Number(r)}><div style={{width: 700, height: 460, boxSizing: 'border-box', padding: 48, background: r ? '#F3DAD3' : '#fff', border: `2px solid ${r ? ROUGE : '#b8b1a1'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
    <div style={{fontFamily: SERIF, fontSize: 82, color: ENCRE, lineHeight: 1.05}}>{a}</div>
    <div style={{fontFamily: MONO, fontSize: 28, color: GRIS, marginTop: 26}}>{b}</div>
  </div></Entre>)}
</div></Fond>;
const Cal: React.FC<V> = ({a, x}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 13, stiffness: 180}});
  return <Fond><div style={{display: 'flex', alignItems: 'center', gap: 70}}>
    <div style={{width: 470, background: CLAIR, boxShadow: '0 26px 70px rgba(0,0,0,.6)', transform: `rotate(-3deg) scale(${s})`}}>
      <div style={{height: 64, background: ROUGE}} />
      <div style={{fontFamily: SERIF, fontSize: a.length > 5 ? 96 : 130, color: ENCRE, textAlign: 'center', padding: '56px 10px'}}>{a}</div>
    </div>
    <Entre a={8}><div style={{fontFamily: SERIF, fontSize: 80, color: CLAIR, maxWidth: 780, lineHeight: 1.1}}>{x}</div></Entre>
  </div></Fond>;
};
const Compteur: React.FC<V> = ({l}) => {
  const f = useCurrentFrame();
  return <Fond f="gris"><div style={{width: 1300, height: 640, position: 'relative'}}>
    <Sur>{l} · illustration</Sur>
    {Array.from({length: 7}, (_, i) => {
      const y = (f * 5 + i * 70) % 490;
      return <div key={i} style={{position: 'absolute', top: 90 + y, width: 1300, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 32, color: ENCRE, opacity: interpolate(y, [0, 60, 420, 490], [0, 1, 1, 0]), borderBottom: '1px solid #7d848d', paddingBottom: 8}}><span>RETRAIT</span><span>EN COURS</span></div>;
    })}
  </div></Fond>;
};
const Grand: React.FC<V> = ({x, s}) => <Fond f="papier"><div style={{position: 'relative', textAlign: 'center', padding: 60}}>
  <Tampon a={2} texte={String(x).toUpperCase()} taille={String(x).length > 18 ? 66 : 100} style={{position: 'relative', display: 'inline-block'}} />
  <Entre a={10}><div style={{fontFamily: MONO, fontSize: 30, color: GRIS, marginTop: 44}}>{s}</div></Entre>
</div></Fond>;
const Offre: React.FC = () => <Fond f="gris"><Feuille w={1100} rot={1}>
  <Sur>Schéma de l'attaque · illustration</Sur>
  <Entre><div style={{fontFamily: SERIF, fontSize: 92}}>Offre d'emploi</div></Entre>
  <Entre a={5}><div style={{fontFamily: MONO, fontSize: 30, marginTop: 16, color: GRIS}}>entretien → test de code</div></Entre>
  <Tampon a={18} texte="FAUSSE" taille={76} style={{right: 70, bottom: 48}} />
</Feuille></Fond>;
const Tornado: React.FC = () => {
  const f = useCurrentFrame();
  return <Fond><svg width="1500" height="640">
    {Array.from({length: 26}, (_, i) => {
      const p = (f * 0.012 + i / 26) % 1;
      const x = 120 + p * 1260;
      const y = 320 + Math.sin(p * Math.PI) * (random(`y${i}`) - 0.5) * 560;
      return <circle key={i} cx={x} cy={y} r={7} fill={p > 0.5 ? DOUX : OR} opacity={interpolate(p, [0, 0.1, 0.9, 1], [0, 1, 1, 0])} />;
    })}
    <rect x="600" y="210" width="300" height="220" fill="#111316" stroke={DOUX} strokeWidth="3" />
    <text x="750" y="318" textAnchor="middle" fontFamily={SERIF} fontSize="50" fill={CLAIR}>Tornado</text>
    <text x="750" y="370" textAnchor="middle" fontFamily={SERIF} fontSize="50" fill={CLAIR}>Cash</text>
    <text x="150" y="620" fontFamily={MONO} fontSize="28" fill={DOUX}>origine visible</text>
    <text x="1120" y="620" fontFamily={MONO} fontSize="28" fill={DOUX}>origine brouillée</text>
  </svg></Fond>;
};
const Wallet: React.FC<V> = ({x, s}) => <Fond><Entre><div style={{width: 820, border: `3px solid ${DOUX}`, padding: 56, textAlign: 'center', background: '#111316'}}>
  <div style={{fontFamily: MONO, fontSize: 26, color: OR}}>PORTEFEUILLE</div>
  <div style={{fontFamily: SERIF, fontSize: 110, color: CLAIR, margin: '14px 0'}}>{x}</div>
  <div style={{fontFamily: MONO, fontSize: 28, color: DOUX}}>{s}</div>
</div></Entre></Fond>;
const Code: React.FC<V> = ({x, s}) => {
  const f = useCurrentFrame();
  const l = ['function sweep(address to) {', '  require(msg.sender == operator);', '  to.transfer(address(this).balance);', '}'];
  return <Fond><div style={{width: 1200}}>
    <div style={{fontFamily: SERIF, fontSize: 84, color: CLAIR, marginBottom: 30}}>{x} <span style={{fontFamily: MONO, fontSize: 26, color: DOUX}}>· illustration simplifiée</span></div>
    <div style={{background: '#050B08', padding: 44, fontFamily: MONO, fontSize: 36, color: '#58d68d', minHeight: 250, lineHeight: 1.5, whiteSpace: 'pre'}}>{l.join('\n').slice(0, Math.floor(f * 3.4))}</div>
    <div style={{fontFamily: MONO, fontSize: 28, color: DOUX, marginTop: 26}}>{s}</div>
  </div></Fond>;
};
const Tests: React.FC<V> = ({n}) => <Fond f="papier"><div style={{display: 'flex', gap: 40}}>
  {[1, 2, 3].map((i) => <Entre key={i} a={(i - 1) * 7}><div style={{position: 'relative', width: 420, height: 330, background: i <= n ? '#fff' : '#ddd6c6', border: '2px solid #a79f8e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 32, color: i <= n ? ENCRE : '#a79f8e'}}>Test {i}{i <= n ? <Tampon a={12 + i * 4} texte="OK" taille={50} style={{right: 26, bottom: 22}} /> : null}</div></Entre>)}
</div></Fond>;
const Signature: React.FC = () => {
  const f = useCurrentFrame();
  return <Fond f="papier"><Feuille w={1120} rot={0.8}>
    <Sur>Retrait · Binance · illustration</Sur>
    <svg width="940" height="220"><path d="M20 150 C80 30 120 200 190 110 S300 60 340 140 S470 170 520 80 S650 40 700 130 S830 170 920 90" fill="none" stroke={ENCRE} strokeWidth="6" strokeDasharray="1500" strokeDashoffset={interpolate(f, [0, 32], [1500, 0], clamp)} /></svg>
    <Tampon a={34} texte="VALIDE" taille={72} style={{right: 60, bottom: 46}} />
  </Feuille></Fond>;
};
const Delegation: React.FC = () => <Fond f="gris"><div style={{display: 'flex', alignItems: 'center', gap: 34}}>
  <Entre><div style={{width: 500, height: 280, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 56, color: ENCRE, textAlign: 'center'}}>Portefeuille</div></Entre>
  <Entre a={8}><div style={{fontFamily: MONO, fontSize: 28, color: ENCRE, textAlign: 'center'}}>autorisation<br />signée<br />→</div></Entre>
  <Entre a={14}><div style={{width: 500, height: 280, background: ENCRE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 56, color: CLAIR}}>Programme</div></Entre>
</div></Fond>;
/** Les 50 autorisations : une seule correspond au numéro du portefeuille. */
const Nonces: React.FC<V> = ({phase}) => {
  const f = useCurrentFrame();
  const cible = 31 + (phase === 2 ? Math.floor(f / 18) % 6 : 0);
  return <Fond><div style={{textAlign: 'center'}}>
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(10, 124px)', gap: 12}}>
      {Array.from({length: 50}, (_, i) => {
        const on = phase >= 3 ? f > i * 0.5 : phase === 0 ? f > i * 1.1 : true;
        const juste = phase === 4 ? i === 31 : phase >= 1 && phase < 4 && i === cible;
        return <div key={i} style={{height: 66, opacity: on ? (phase === 4 && i !== 31 ? 0.18 : 1) : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 24, color: juste ? CLAIR : ENCRE, background: juste ? ROUGE : PAPIER}}>{phase === 0 ? 'SIG' : 4800 + i}</div>;
      })}
    </div>
    <div style={{fontFamily: MONO, fontSize: 28, color: DOUX, marginTop: 30}}>{phase === 4 ? 'une seule autorisation s\'applique · numéros illustratifs' : '50 autorisations, une seule transaction · numéros illustratifs'}</div>
  </div></Fond>;
};
const Frise: React.FC<V> = ({tt, p}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 30], [0, 1], clamp);
  return <Fond f="papier"><div style={{width: 1560}}>
    <Sur>{tt}</Sur>
    <div style={{position: 'relative', height: 300}}>
      <div style={{position: 'absolute', top: 110, height: 4, width: 1560 * a, background: ENCRE}} />
      {p.map(([h, n]: string[], i: number) => {
        const x = (i / (p.length - 1)) * 1420 + 40;
        return <Entre key={h} a={i * 5} style={{position: 'absolute', left: x - 90, width: 180, top: 40, textAlign: 'center'}}>
          <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: ENCRE}}>{h}</div>
          <div style={{width: 24, height: 24, background: ROUGE, borderRadius: 12, margin: '19px auto'}} />
          <div style={{fontFamily: SERIF, fontSize: 32, color: ENCRE, lineHeight: 1.1}}>{n}</div>
        </Entre>;
      })}
    </div>
  </div></Fond>;
};
const Partage: React.FC<V> = ({g, t2}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [2, 24], [0, 1], {easing: Easing.out(Easing.cubic), ...clamp});
  const w = 1320 * (g / t2);
  return <Fond><div style={{width: 1320}}>
    <div style={{fontFamily: MONO, fontSize: 28, color: DOUX, marginBottom: 20}}>{t2.toString().replace('.', ',')} MILLIARDS DE DOLLARS</div>
    <div style={{display: 'flex', height: 130}}>
      <div style={{width: w * a, background: '#8fb4cf'}} />
      <div style={{width: (1320 - w) * a, background: ROUGE}} />
    </div>
    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 26, fontFamily: SERIF, fontSize: 60, color: CLAIR, opacity: a}}><span>≈ {g.toFixed(0)} Md$ gelés</span><span>le reste, hors de portée</span></div>
  </div></Fond>;
};
const Echange: React.FC<V> = ({g, d: dr}) => <Fond f="papier"><div style={{display: 'flex', alignItems: 'center', gap: 50}}>
  <Entre><div style={{fontFamily: SERIF, fontSize: 96, color: ENCRE}}>{g}</div><div style={{fontFamily: MONO, fontSize: 26, color: ROUGE, marginTop: 10}}>peut être gelé</div></Entre>
  <Entre a={7}><div style={{fontFamily: MONO, fontSize: 90, color: ROUGE}}>→</div></Entre>
  <Entre a={12}><div style={{fontFamily: SERIF, fontSize: 96, color: ENCRE}}>{dr}</div><div style={{fontFamily: MONO, fontSize: 26, color: GRIS, marginTop: 10}}>pas d'émetteur pour le geler</div></Entre>
</div></Fond>;
const Chaine: React.FC<V> = ({e, fin}) => <Fond f="gris"><div style={{display: 'flex', alignItems: 'center', gap: 22}}>
  {e.map((x: string, i: number) => <div key={x} style={{display: 'flex', alignItems: 'center', gap: 22}}>
    {i ? <Entre a={i * 9}><div style={{fontFamily: MONO, fontSize: 56, color: ENCRE}}>→</div></Entre> : null}
    <Entre a={i * 9}><div style={{width: 420, height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 22, boxSizing: 'border-box', fontFamily: SERIF, fontSize: 50, background: i === e.length - 1 && fin ? ROUGE : '#fff', color: i === e.length - 1 && fin ? CLAIR : ENCRE}}>{x}</div></Entre>
  </div>)}
</div></Fond>;
const Machine: React.FC = () => {
  const f = useCurrentFrame();
  return <Fond><div style={{textAlign: 'center'}}>
    <div style={{display: 'flex', gap: 22, justifyContent: 'center', marginBottom: 40}}>
      {['ETH', 'BTC', 'XRP', 'SOL', 'TRX'].map((x, i) => <Entre key={x} a={i * 6}><div style={{width: 200, padding: '42px 0', background: PAPIER, fontFamily: MONO, fontSize: 32, color: ENCRE}}>{x}<div style={{color: ROUGE, fontSize: 24, marginTop: 8, opacity: f > 8 + i * 6 ? 1 : 0}}>signé</div></div></Entre>)}
    </div>
    <div style={{fontFamily: SERIF, fontSize: 72, color: CLAIR}}>Système de signature</div>
    <div style={{fontFamily: MONO, fontSize: 27, color: DOUX, marginTop: 16}}>hypothèse de TRM Labs · Binance n'a pas publié de cause</div>
  </div></Fond>;
};
const Dossier: React.FC<V> = ({n, o, c}) => <Fond f="gris"><Feuille w={1120} rot={-1.2} style={{background: '#E7D9B8'}}>
  <Sur>Dossier</Sur>
  <Entre><div style={{fontFamily: SERIF, fontSize: 112}}>{n}</div></Entre>
  <Entre a={5}><div style={{fontFamily: MONO, fontSize: 34, marginTop: 12}}>{o}</div></Entre>
  <Entre a={10}><div style={{fontFamily: MONO, fontSize: 28, marginTop: 30, color: ROUGE}}>{c}</div></Entre>
</Feuille></Fond>;
const Peel: React.FC = () => {
  const f = useCurrentFrame();
  return <Fond><svg width="1660" height="620">
    {Array.from({length: 8}, (_, i) => {
      const x = 60 + i * 200, on = f > i * 8;
      return <g key={i} opacity={on ? 1 : 0}>
        {i < 7 ? <line x1={x + 90} y1={230} x2={x + 200} y2={230} stroke={DOUX} strokeWidth="4" /> : null}
        <line x1={x + 45} y1={270} x2={x + 45} y2={380} stroke={ROUGE} strokeWidth="4" />
        <rect x={x} y={190} width={90} height={80} fill={PAPIER} />
        <rect x={x + 12} y={380} width={66} height={54} fill={ROUGE} />
        <text x={x + 45} y={415} textAnchor="middle" fontFamily={MONO} fontSize="19" fill={CLAIR}>{i % 2 ? '100' : '1 000'}</text>
      </g>;
    })}
    <text x="60" y="130" fontFamily={SERIF} fontSize="62" fill={CLAIR}>Chaîne de pelage</text>
    <text x="60" y="520" fontFamily={MONO} fontSize="28" fill={DOUX}>morceaux de 100 ou 1 000 BTC · schéma</text>
  </svg></Fond>;
};
const Rapport: React.FC<V> = ({q, tt = 'Rapport technique · promis par Binance', Q: QQ}) => {
  const Q = QQ ?? ["Comment l'ordinateur a-t-il été compromis ?", "Quels autres points d'entrée ?", 'Pourquoi autant dans une caisse ?'];
  return <Fond f="papier"><Feuille w={1300}>
    <Sur>{tt}</Sur>
    {Q.map((x: string, i: number) => <div key={x} style={{display: 'flex', gap: 28, alignItems: 'center', padding: '20px 0', opacity: i < q ? 1 : 0.22}}>
      <div style={{width: 44, height: 44, border: `4px solid ${i < q ? ROUGE : ENCRE}`, flex: 'none'}} />
      <div style={{fontFamily: SERIF, fontSize: 56}}>{x}</div>
    </div>)}
  </Feuille></Fond>;
};
const Abo: React.FC = () => <Fond><div style={{textAlign: 'center'}}>
  <Entre><div style={{fontFamily: SERIF, fontSize: 130, color: CLAIR}}>La Faille</div></Entre>
  <Entre a={8}><div style={{display: 'inline-block', marginTop: 34, background: ROUGE, color: CLAIR, fontFamily: MONO, fontWeight: 600, fontSize: 38, padding: '18px 54px', borderRadius: 40}}>S'ABONNER</div></Entre>
</div></Fond>;
const Prochaine: React.FC = () => <Fond f="papier"><Feuille w={1200} rot={1}>
  <Sur>Prochaine faille</Sur>
  <Entre><div style={{fontFamily: SERIF, fontSize: 120, lineHeight: 1.05}}>La taxe carbone</div></Entre>
  <Entre a={6}><div style={{fontFamily: MONO, fontSize: 30, color: GRIS, marginTop: 20}}>une affaire française</div></Entre>
</Feuille></Fond>;

const Ordi: React.FC = () => {
  const f = useCurrentFrame();
  const code = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 320;
    const x = c.getContext('2d')!;
    x.fillStyle = '#050b08'; x.fillRect(0, 0, 512, 320);
    x.font = '14px monospace';
    for (let i = 0; i < 18; i++) { x.fillStyle = random(`o${i}`) > 0.8 ? '#ff5a45' : '#58d68d'; x.fillText('$ ' + Math.floor(random(`p${i}`) * 1e12).toString(16).repeat(2), 14, 20 + i * 17); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return <ThreeCanvas width={1920} height={1080} shadows>
    <color attach="background" args={['#030405']} />
    <Reflets force={0.14} />
    <Camera p={[1.5 - f * 0.002, 1.5, 4.6 - f * 0.004]} c={[0, 0.25, 0]} />
    <ambientLight intensity={0.1} />
    <spotLight position={[0.4, 4, 0.8]} angle={0.5} penumbra={0.8} intensity={120} color="#ffe2b0" castShadow />
    <pointLight position={[-3, 1.4, -1.6]} intensity={40} color="#ff2412" distance={8} />
    <mesh position={[0, -0.1, 0]} castShadow receiveShadow><boxGeometry args={[4.4, 0.12, 2.3]} /><meshStandardMaterial color="#1b1e22" metalness={0.5} roughness={0.42} /></mesh>
    <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#090a0c" /></mesh>
    <group position={[0, 0, -0.2]}>
      <mesh position={[0, 0, 0.32]} castShadow><boxGeometry args={[1.5, 0.04, 0.95]} /><meshStandardMaterial color="#6f747b" metalness={0.9} roughness={0.32} /></mesh>
      <group position={[0, 0.02, -0.14]} rotation={[-0.2, 0, 0]}>
        <mesh position={[0, 0.48, 0]}><boxGeometry args={[1.5, 0.96, 0.03]} /><meshStandardMaterial color="#555a60" metalness={0.9} roughness={0.32} /></mesh>
        <mesh position={[0, 0.48, 0.018]}><planeGeometry args={[1.4, 0.86]} /><meshBasicMaterial map={code} /></mesh>
      </group>
    </group>
    <pointLight position={[0, 0.6, 0.5]} intensity={3} color="#58d68d" distance={3} />
  </ThreeCanvas>;
};

/** Vue du coffre : pleine, vide en fin de vidéo, ou porte froide fermée. */
const VueCoffre: React.FC<{vide?: boolean; froid?: boolean; d: number}> = ({vide, froid, d}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, d], [0, 1], clamp);
  if (froid) return <ThreeCanvas width={1920} height={1080}>
    <color attach="background" args={['#050810']} />
    <Reflets force={0.5} />
    <Camera p={[0.2, 0.1, 5 - k * 0.7]} c={[0, 0, 0]} />
    <ambientLight intensity={0.3} color="#8fb4ef" />
    <spotLight position={[1, 3, 4]} angle={0.8} penumbra={0.7} intensity={150} color="#a7c7ff" />
    <mesh position={[0, 0, -0.35]}><planeGeometry args={[20, 12]} /><meshStandardMaterial color="#172233" /></mesh>
    <Porte position={[0, 0, 0]} ouverture={0} />
  </ThreeCanvas>;
  return <ThreeCanvas width={1920} height={1080} shadows>
    <Camera p={[1.4 - k * 0.4, 2.5, 8.2 - k * 0.7]} c={[-0.65, 0.35, -0.8]} />
    <Salle vidange={vide ? 1 : 0} ouverture={1.25} alarme={vide ? 0.6 : 0} />
  </ThreeCanvas>;
};
const Chrono2: React.FC<V> = ({fin, d}) => {
  const f = useCurrentFrame();
  const sec = fin ? 204 : interpolate(f, [0, d], [0, 200], clamp);
  return <AbsoluteFill>
    <ThreeCanvas width={1920} height={1080} shadows>
      <Camera p={[1.2, 2.45, 7.9]} c={[-0.65, 0.35, -0.8]} />
      <Salle vidange={fin ? interpolate(f, [0, 40], [0, 1], clamp) : 0} ouverture={1.25} alarme={fin ? 1 : 0} />
    </ThreeCanvas>
    <Chrono secondes={sec} vide={Boolean(fin) && f > 42} />
    <Etiquette>21:20:59 → 21:24:23 · PARIS</Etiquette>
  </AbsoluteFill>;
};
/** Le chrono de l'accroche : rien ne bouge, puis tout part d'un coup à 3:24. */
const Chrono1: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const fin = d - 22;
  return <AbsoluteFill>
    <ThreeCanvas width={1920} height={1080} shadows>
      <Camera p={[1.4, 2.5 + Math.sin(f / 30) * 0.03, interpolate(f, [0, d], [8.4, 7.7], clamp)]} c={[-0.65, 0.35, -0.8]} />
      <Salle vidange={interpolate(f, [fin - 4, d - 2], [0, 1], clamp)} ouverture={1.25} alarme={interpolate(f, [fin - 4, fin + 8], [0, 1], clamp)} />
    </ThreeCanvas>
    <Chrono secondes={interpolate(f, [4, fin], [0, 204], {easing: Easing.bezier(0.3, 0, 0.8, 1), ...clamp})} vide={f >= d - 6} />
    <Etiquette>21:20:59 → 21:24:23 · PARIS</Etiquette>
  </AbsoluteFill>;
};
const Total: React.FC<V> = ({txt, d}) => {
  const f = useCurrentFrame();
  const n = interpolate(f, [2, Math.max(10, Math.min(55, d - 8))], [0, txt], {easing: Easing.out(Easing.cubic), ...clamp});
  return <AbsoluteFill>
    <ThreeCanvas width={1920} height={1080} shadows>
      <Camera p={[-4.25 + f * 0.002, 1.05, interpolate(f, [0, d], [4.7, 3.9], clamp)]} c={[-4.3, 1.05, -2]} fov={42} />
      <Salle vidange={1} ouverture={1.3} alarme={1} />
    </ThreeCanvas>
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle, rgba(0,0,0,.25) 0%, rgba(0,0,0,.72) 75%)'}}>
      <div style={{fontFamily: SERIF, fontWeight: 500, fontSize: 150, color: CLAIR, fontVariantNumeric: 'tabular-nums'}}>{n.toFixed(txt === 6.36 ? 2 : 1).replace('.', ',')} milliards $</div>
      <div style={{fontFamily: MONO, fontSize: 25, letterSpacing: 4, color: DOUX, marginTop: 8}}>SORTIS DE BINANCE EN QUELQUES HEURES</div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

export const DEUX_D: Record<string, React.FC<any>> = {titre: Titre, stat: Stat, heure: Heure, cit: Cit, gel: Gel, liste: Liste, barres: Barres, tele: Tele, article: Article, reseaux: Reseaux, chap: Chap, deux: Deux, cal: Cal, compteur: Compteur, tampon: Grand, offre: Offre, tornado: Tornado, portefeuille: Wallet, code: Code, tests: Tests, signature: Signature, delegation: Delegation, nonces: Nonces, frise: Frise, partage: Partage, echange: Echange, chaine: Chaine, machine: Machine, dossier: Dossier, peel: Peel, rapport: Rapport, abo: Abo, prochaine: Prochaine};

export const Visuel: React.FC<{v: V; d: number; i: number}> = ({v, d, i}) => {
  const C = DEUX_D[v.t];
  if (C) {
    // `v.d` peut déjà désigner le côté droit d'un plan « deux » : la durée passe après.
    const props = v.t === 'deux' || v.t === 'echange' ? {...v, i} : {...v, d, i};
    return v.t === 'tele' || v.t === 'article' ? <C {...props} /> : <Vie i={i} d={d}><C {...props} /></Vie>;
  }
  switch (v.t) {
    case 'sil': return <Silhouette recu={v.etape === 1} debut={2} />;
    case 'chrono': return <Chrono1 d={d} />;
    case 'chrono2': return <Chrono2 fin={v.fin} d={d} />;
    case 'total': return <Total txt={6.3} d={d} />;
    case 'total2': return <Total txt={6.36} d={d} />;
    case 'croix': return <AbsoluteFill><CouloirFond /><Carte debut={1} texte={String(v.x).toUpperCase()} type={v.p} /></AbsoluteFill>;
    case 'vault': return <VueCoffre froid={v.v === 'froid'} d={d} />;
    case 'coffreplein': return <VueCoffre d={d} />;
    case 'coffrevide': return <VueCoffre vide d={d} />;
    case 'ordi': return <Ordi />;
    default: throw new Error(`Visuel inconnu : ${v.t}`);
  }
};

export const Fondu7: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: interpolate(f, [0, 7], [0, 1], clamp)}}>{children}</AbsoluteFill>;
};

export const LaFaille01: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#020203'}}>
    {plan.beats.map((b, i) => {
      const d = b.f - b.d;
      return <Sequence key={i} from={b.d} durationInFrames={d + 7} name={`${i} ${b.v.t}`}>
        <Fondu7><Visuel v={b.v as V} d={d} i={i} /></Fondu7>
      </Sequence>;
    })}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse, rgba(0,0,0,0) 62%, rgba(0,0,0,.34) 100%)', pointerEvents: 'none'}} />
    <Audio src={staticFile('lafaille01/mix.wav')} />
  </AbsoluteFill>
);
