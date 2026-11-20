import {loadFont as chargerLora} from '@remotion/google-fonts/Lora';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {useMat} from '../ile/outils3d';
import {Figurine} from '../panne/PanneProto';

/**
 * Prototype muet de 20 s — « ONE LIFE » : internet vit une seule vie, un épisode = un an,
 * les probabilités tirent le résultat à la roue, la mort est définitive.
 * Les pourcentages sont ILLUSTRATIFS : à remplacer par des chiffres sourcés avant toute publication.
 */
const {fontFamily: SERIF} = chargerLora('normal', {weights: ['400', '500'], subsets: ['latin']});
chargerLora('italic', {weights: ['400'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['500'], subsets: ['latin']});

export const DUREE_ONELIFE_PROTO = 600;
type V3 = [number, number, number];

// Timeline (30 i/s)
const T_JOB = 80;        // roue 1 : job d'été
const T_JOB_FIN = 205;
const T_MOTO = 215;      // il achète une moto : le risque monte
const T_MORT = 330;      // roue de la mort
const T_MORT_FIN = 470;
const T_VOTE = 478;

const VERT = '#3ccf7a', ROUGE = '#ff4a4a', OR = '#ffcf5a';
const ombre = '0 2px 16px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.55)';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ décor : rue pavillonnaire, plein jour */

const Maison: React.FC<{p: V3; mur: string; toit: string; rot?: number}> = ({p, mur, toit, rot = 0}) => {
  const mMur = useMat(mur), mToit = useMat(toit), mPorte = useMat('#6b4a2a'), mVitre = useMat('#bfe3f5');
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <mesh material={mMur} position={[0, 1.4, 0]}><boxGeometry args={[4, 2.8, 3.4]} /></mesh>
      <mesh material={mToit} position={[0, 3.5, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[3.3, 1.5, 4]} /></mesh>
      <mesh material={mPorte} position={[0, 0.8, 1.71]}><boxGeometry args={[0.8, 1.6, 0.05]} /></mesh>
      {[-1.25, 1.25].map((x) => <mesh key={x} material={mVitre} position={[x, 1.7, 1.71]}><boxGeometry args={[0.8, 0.7, 0.05]} /></mesh>)}
    </group>
  );
};

const Arbre: React.FC<{p: V3; s: number}> = ({p, s}) => {
  const tronc = useMat('#7a5232'), feuilles = useMat('#4fa35a');
  return (
    <group position={p} scale={s}>
      <mesh material={tronc} position={[0, 0.7, 0]}><cylinderGeometry args={[0.14, 0.18, 1.4, 6]} /></mesh>
      <mesh material={feuilles} position={[0, 2, 0]}><icosahedronGeometry args={[0.95, 0]} /></mesh>
    </group>
  );
};

const Moto: React.FC<{p: V3; e: number}> = ({p, e}) => {
  const corps = useMat('#d63a3a', {roughness: 0.4}), noir = useMat('#181818'), chrome = useMat('#c9cdd2', {roughness: 0.2});
  if (e <= 0.001) return null;
  return (
    <group position={p} rotation={[0, -0.9, 0]} scale={e}>
      {[-0.7, 0.7].map((z) => <mesh key={z} material={noir} position={[0, 0.36, z]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.3, 0.09, 8, 16]} /></mesh>)}
      <mesh material={corps} position={[0, 0.72, 0.05]}><boxGeometry args={[0.36, 0.34, 1.1]} /></mesh>
      <mesh material={noir} position={[0, 0.92, -0.25]}><boxGeometry args={[0.32, 0.1, 0.6]} /></mesh>
      <mesh material={chrome} position={[0, 1.05, 0.62]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.8, 6]} /></mesh>
    </group>
  );
};

const Scene: React.FC<{f: number}> = ({f}) => {
  const {scene, camera} = useThree();
  scene.background = new THREE.Color('#9fd3f0');
  scene.fog = new THREE.Fog('#bfe2f2', 25, 70);
  const herbe = useMat('#7cc46a'), route = useMat('#5a5d63'), trottoir = useMat('#cfcac0'), ligne = useMat('#f2f2ea');

  // orbite lente autour du héros
  const a = interpolate(f, [0, DUREE_ONELIFE_PROTO], [-0.45, 0.5]);
  const r = interpolate(f, [0, DUREE_ONELIFE_PROTO], [7.4, 5.6]);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(Math.sin(a) * r, 2.1, Math.cos(a) * r);
  cam.lookAt(0, 1.35, 0);
  if (cam.fov !== 42) { cam.fov = 42; cam.updateProjectionMatrix(); }

  const moto = spring({frame: f - T_MOTO, fps: 30, config: {damping: 11, stiffness: 140}});
  return (
    <>
      <hemisphereLight args={['#ffffff', '#6a8a4a', 1.2]} />
      <directionalLight position={[6, 10, 5]} intensity={2.2} />
      <mesh material={herbe} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[160, 160]} /></mesh>
      <mesh material={route} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 3.6]}><planeGeometry args={[160, 4.4]} /></mesh>
      {Array.from({length: 20}, (_, i) => (
        <mesh key={i} material={ligne} rotation={[-Math.PI / 2, 0, 0]} position={[-38 + i * 4, 0.02, 3.6]}><planeGeometry args={[1.8, 0.14]} /></mesh>
      ))}
      <mesh material={trottoir} position={[0, 0.06, 0.6]}><boxGeometry args={[160, 0.12, 1.6]} /></mesh>
      <Maison p={[0, 0, -4.2]} mur="#f3e3c3" toit="#c2563f" />
      <Maison p={[-6.5, 0, -4.6]} mur="#cfe0f0" toit="#4a5d7a" />
      <Maison p={[6.5, 0, -4.4]} mur="#f0d0d6" toit="#7a4a4a" />
      <Maison p={[-6, 0, 9.5]} mur="#e6e6d6" toit="#5a7a4a" rot={Math.PI} />
      <Maison p={[6.2, 0, 9.8]} mur="#f6e7b8" toit="#a04a2a" rot={Math.PI} />
      {[[-3.2, -1.6, 1.1], [3.3, -1.8, 0.9], [-10, -2, 1.2], [10.5, -1.5, 1.0], [-2.8, 7.4, 1.0]].map(([x, z, s], i) => (
        <Arbre key={i} p={[x, 0, z]} s={s} />
      ))}
      <Moto p={[1.35, 0.12, 0.55]} e={moto} />
      <Figurine p={[0, 0.12, 0.5]} rotY={0} tenue="#2f6db5" peau="#c98a5a" pantalon="#2a2f3a" marche={0} phase={0} regardeHaut={0} yeux echelle={1.05} />
    </>
  );
};

/* ------------------------------------------------------------------ compteurs */

const Barre: React.FC<{label: string; v: number; couleur: string}> = ({label, v, couleur}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 10}}>
    <div style={{fontFamily: MONO, fontSize: 20, letterSpacing: 3, width: 150, opacity: 0.85}}>{label}</div>
    <div style={{width: 200, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.25)'}}>
      <div style={{width: `${Math.min(1, v) * 100}%`, height: '100%', borderRadius: 6, background: couleur}} />
    </div>
  </div>
);

const Compteurs: React.FC<{f: number}> = ({f}) => {
  const argent = Math.round(340 + interpolate(f, [T_JOB_FIN - 30, T_JOB_FIN - 5], [0, 2400], clamp) - interpolate(f, [T_MOTO + 10, T_MOTO + 35], [0, 1900], clamp));
  const risque = interpolate(f, [T_MOTO + 20, T_MOTO + 60], [0.09, 0.61], clamp);
  const bonheur = 0.48 + interpolate(f, [T_JOB_FIN - 20, T_JOB_FIN], [0, 0.14], clamp) + interpolate(f, [T_MOTO + 10, T_MOTO + 30], [0, 0.12], clamp);
  const o = interpolate(f, [T_VOTE - 10, T_VOTE + 6], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 120, left: 60, color: '#fff', textShadow: ombre, opacity: o}}>
      <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 5, opacity: 0.85}}>ONE LIFE · REAL ODDS</div>
      <div style={{fontFamily: SERIF, fontSize: 120, lineHeight: 1}}>Age 17</div>
      <div style={{fontFamily: SERIF, fontSize: 52, marginTop: 6}}>${argent.toLocaleString('en-US')}</div>
      <Barre label="HEALTH" v={0.86} couleur={VERT} />
      <Barre label="HAPPINESS" v={bonheur} couleur={OR} />
      <div style={{fontFamily: MONO, fontSize: 21, letterSpacing: 2, marginTop: 16, color: risque > 0.3 ? '#ffb0a8' : '#fff'}}>
        RISK OF DYING THIS YEAR · {risque.toFixed(2)}%
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ roue des probabilités */

type Part = {p: number; couleur: string; label: string};

const arc = (r: number, a0: number, a1: number) => {
  // angles en degrés, 0 = haut, sens horaire
  const pt = (a: number) => [Math.sin((a * Math.PI) / 180) * r, -Math.cos((a * Math.PI) / 180) * r];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  return `M0,0 L${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1} Z`;
};

/** La roue tourne puis s'arrête sur `cible` (angle en degrés dans la roue, 0 = début de la 1re part). */
const Roue: React.FC<{f: number; debut: number; duree: number; parts: Part[]; cible: number; tours: number; titre: string; sousTitre: string; verdict: string; couleurVerdict: string}> = ({
  f, debut, duree, parts, cible, tours, titre, sousTitre, verdict, couleurVerdict,
}) => {
  const {fps} = useVideoConfig();
  const t = f - debut;
  if (t < 0 || t > duree + 30) return null;
  const entree = spring({frame: t, fps, config: {damping: 14, stiffness: 170}});
  const sortie = interpolate(t, [duree + 10, duree + 28], [1, 0], clamp);
  const tSpin = interpolate(t, [18, duree - 30], [0, 1], {...clamp, easing: Easing.bezier(0.12, 0.6, 0.12, 1)});
  const rot = (360 * tours - cible) * tSpin;
  const fini = t > duree - 28;
  const R = 300;
  let acc = 0;
  return (
    <AbsoluteFill style={{background: `rgba(6,10,26,${0.55 * entree * sortie})`, alignItems: 'center', paddingTop: 470, opacity: sortie}}>
      <div style={{fontFamily: SERIF, fontSize: 58, color: '#fff', textShadow: ombre, opacity: entree, textAlign: 'center', padding: '0 60px'}}>{titre}</div>
      <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: '#fff', opacity: 0.75 * entree, marginTop: 10}}>{sousTitre}</div>
      <div style={{display: 'flex', gap: 40, marginTop: 26, opacity: entree}}>
        {parts.map((pa) => (
          <div key={pa.label} style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 30, color: '#fff', textShadow: ombre}}>
            <div style={{width: 26, height: 26, borderRadius: 6, background: pa.couleur, border: '2px solid rgba(255,255,255,0.6)'}} />
            {pa.label} {pa.p < 0.1 || pa.p > 0.9 ? (pa.p * 100).toFixed(2) : Math.round(pa.p * 100)}%
          </div>
        ))}
      </div>
      <div style={{position: 'relative', marginTop: 24, transform: `scale(${0.7 + 0.3 * entree})`}}>
        <svg width={R * 2 + 40} height={R * 2 + 70} viewBox={`${-R - 20} ${-R - 50} ${R * 2 + 40} ${R * 2 + 70}`}>
          <g transform={`rotate(${rot})`}>
            {parts.map((pa, i) => {
              const a0 = acc * 360, a1 = (acc + pa.p) * 360;
              acc += pa.p;
              return (
                <g key={i}>
                  <path d={arc(R, a0, Math.max(a1, a0 + 0.6))} fill={pa.couleur} stroke="#0b0f1e" strokeWidth={3} />
                </g>
              );
            })}
            <circle r={34} fill="#0b0f1e" />
          </g>
          <path d={`M-22,${-R - 44} L22,${-R - 44} L0,${-R + 6} Z`} fill="#fff" stroke="#0b0f1e" strokeWidth={4} />
        </svg>
      </div>
      <div style={{fontFamily: SERIF, fontSize: 72, color: couleurVerdict, textShadow: ombre, marginTop: 10,
        opacity: fini ? interpolate(t, [duree - 28, duree - 16], [0, 1], clamp) : 0,
        transform: `scale(${fini ? 0.8 + 0.2 * spring({frame: t - (duree - 28), fps, config: {damping: 9}}) : 0.8})`}}>
        {verdict}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ texte & vote */

const LIGNES: {de: number; a: number; t: string}[] = [
  {de: 8, a: T_JOB - 4, t: 'Last year, 71% of you made him quit football.'},
  {de: T_MOTO, a: T_MORT - 6, t: 'He spends it all on a used motorcycle.'},
];

const Ligne: React.FC<{f: number}> = ({f}) => {
  const l = LIGNES.find((x) => f >= x.de && f < x.a);
  if (!l) return null;
  const o = interpolate(f, [l.de, l.de + 8, l.a - 8, l.a], [0, 1, 1, 0]);
  return (
    <div style={{position: 'absolute', top: 1560, left: 70, right: 70, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 50, color: '#fff', textShadow: ombre, opacity: o}}>
      {l.t}
    </div>
  );
};

const OPTIONS: [string, string][] = [['A', 'Go to college'], ['B', 'Join the army'], ['C', "Work at his uncle's garage"]];

const Vote: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < T_VOTE) return null;
  const fond = interpolate(f, [T_VOTE, T_VOTE + 14], [0, 0.6], clamp);
  const e = (d: number) => spring({frame: f - T_VOTE - d, fps, config: {damping: 14, stiffness: 160}});
  return (
    <AbsoluteFill style={{background: `rgba(6,10,26,${fond})`, alignItems: 'center', paddingTop: 520}}>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 8, color: OR, opacity: e(0)}}>HE SURVIVED AGE 17</div>
      <div style={{fontFamily: SERIF, fontSize: 92, color: '#fff', marginTop: 10, textShadow: ombre, opacity: e(4), transform: `translateY(${(1 - e(4)) * 30}px)`}}>Age 18.</div>
      <div style={{fontFamily: SERIF, fontSize: 60, color: '#fff', textShadow: ombre, opacity: e(8)}}>What does he do?</div>
      <div style={{marginTop: 60, display: 'flex', flexDirection: 'column', gap: 28, width: 860}}>
        {OPTIONS.map(([k, t], i) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 28, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.28)', borderRadius: 22, padding: '22px 28px',
            opacity: e(16 + i * 7), transform: `translateX(${(1 - e(16 + i * 7)) * -60}px)`}}>
            <div style={{width: 72, height: 72, borderRadius: 36, background: OR, color: '#1b1406', fontFamily: SERIF, fontWeight: 500, fontSize: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{k}</div>
            <div style={{fontFamily: SERIF, fontSize: 44, color: '#fff', whiteSpace: 'nowrap'}}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 56, fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, color: '#fff', opacity: e(40) * 0.92, textAlign: 'center', lineHeight: 1.3}}>
        Your vote decides.<br />If he dies, it&apos;s over.
      </div>
    </AbsoluteFill>
  );
};

export const OneLifeProto: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  // part rouge de la roue de la mort, à sa vraie taille (illustrative) : 0,61 %
  const pMort = 0.0061;
  return (
    <AbsoluteFill style={{background: '#9fd3f0'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 42, near: 0.1, far: 300}} gl={{antialias: true}}>
        <Scene f={f} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,14,30,0.45) 0%, rgba(10,14,30,0) 34%, rgba(0,0,0,0) 72%, rgba(10,14,30,0.4) 100%)'}} />
      <Compteurs f={f} />
      <Ligne f={f} />
      <Roue f={f} debut={T_JOB} duree={T_JOB_FIN - T_JOB} tours={3}
        parts={[{p: 0.62, couleur: VERT, label: 'HIRED'}, {p: 0.38, couleur: '#5a6070', label: 'NO'}]}
        cible={0.62 * 360 * 0.55} titre="He applies for a summer job." sousTitre="ODDS OF GETTING HIRED"
        verdict="Hired. +$2,400" couleurVerdict={VERT} />
      <Roue f={f} debut={T_MORT} duree={T_MORT_FIN - T_MORT} tours={4}
        parts={[{p: pMort, couleur: ROUGE, label: 'DIES'}, {p: 1 - pMort, couleur: '#3a4766', label: 'LIVES'}]}
        cible={pMort * 360 + 4.5} titre="Does he survive the year?" sousTitre="ONE SPIN. NO SECOND CHANCE."
        verdict="He lives." couleurVerdict="#ffffff" />
      <Vote f={f} />
      <div style={{position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: 'rgba(255,255,255,0.55)'}}>
        PROTOTYPE · ILLUSTRATIVE ODDS
      </div>
    </AbsoluteFill>
  );
};
