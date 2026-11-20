import {loadFont as chargerSerif} from '@remotion/google-fonts/Newsreader';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import plan from '../../public/lafaille02/plan.json';
import {Camera, Etiquette, Reflets, Tampon} from './BinanceAccroche';
import {DEUX_D, DossierCtx, Entre, Feuille, Fond, Fondu7, Sur, TAILLES, Visuel} from './LaFaille01';

/** La Faille 02 : l'arnaque à la « taxe carbone ». Réutilise les plans de la 01, ajoute la 3D du sujet. */
const {fontFamily: SERIF} = chargerSerif('normal', {weights: ['500'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['400', '600'], subsets: ['latin']});
const ENCRE = '#1A1A1C', ROUGE = '#D22B1F', OR = '#E0A92E', DOUX = '#C9C4B8';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type V = Record<string, any>;
export const DUREE_LAFAILLE02 = plan.frames;

Object.assign(TAILLES, {reporterre: [900, 430], wiki: [1250, 1050], rtbf: [1100, 950], europe1: [1200, 320], brutart: [1000, 900]});

const panneau = (texte: string, sous = '', fond = '#EFE9DC', encre = ENCRE) => {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 240;
  const x = c.getContext('2d')!;
  x.fillStyle = fond; x.fillRect(0, 0, 640, 240);
  x.fillStyle = encre; x.textAlign = 'center';
  x.font = '600 60px Georgia, serif'; x.fillText(texte, 320, sous ? 112 : 140);
  if (sous) { x.font = '34px monospace'; x.fillStyle = '#57534b'; x.fillText(sous, 320, 178); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

/** L'usine au crépuscule : l'idée de départ, faire payer la pollution. */
const Usine: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const fumee = useMemo(() => Array.from({length: 90}, (_, i) => ({c: i % 3, o: random(`o${i}`), x: random(`x${i}`) - 0.5})), []);
  const k = interpolate(f, [0, d], [0, 1], clamp);
  return <ThreeCanvas width={1920} height={1080} shadows>
    <color attach="background" args={['#a8452a']} />
    <fog attach="fog" args={['#3a1c14', 30, 70]} />
    <Reflets force={0.16} />
    <Camera p={[-11 + k * 1.6, 3, 27 - k * 2]} c={[0, 8, 0]} fov={44} />
    <ambientLight intensity={0.8} color="#ffb48a" />
    <directionalLight position={[-20, 7, -14]} intensity={5} color="#ff8a4a" castShadow />
    <pointLight position={[2, 3, 7]} intensity={70} color="#ff5a2a" distance={22} />
    <mesh position={[0, 30, -30]}><planeGeometry args={[400, 160]} /><meshBasicMaterial color="#a8452a" /></mesh>
    <mesh position={[-14, 8, -29]}><circleGeometry args={[4.2, 48]} /><meshBasicMaterial color="#ffb062" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[120, 90]} /><meshStandardMaterial color="#120f0f" roughness={0.65} metalness={0.3} /></mesh>
    <mesh position={[1, 2.4, 0]} castShadow receiveShadow><boxGeometry args={[14, 4.8, 6]} /><meshStandardMaterial color="#25211f" metalness={0.5} roughness={0.55} /></mesh>
    {[-5, -2.4, 0.2, 2.8, 5.4].map((x) => <mesh key={x} position={[1 + x, 5.5, 0]} rotation={[0, 0, 0.55]} castShadow><boxGeometry args={[3.1, 0.25, 5.9]} /><meshStandardMaterial color="#1b1817" /></mesh>)}
    {Array.from({length: 12}, (_, i) => <mesh key={i} position={[-4.4 + i * 0.95, 1.8, 3.02]}><planeGeometry args={[0.46, 1]} /><meshBasicMaterial color={random(`w${i}`) > 0.35 ? '#ffb45a' : '#3a2c22'} /></mesh>)}
    {[[-3.5, 6], [0, 7.4], [3.5, 6.4]].map(([x, h]) => <mesh key={x} position={[x, 4.8 + h / 2, -1]} castShadow><cylinderGeometry args={[0.42, 0.62, h, 28]} /><meshStandardMaterial color="#312a27" roughness={0.6} /></mesh>)}
    {fumee.map((p, i) => {
      const t = (f * 0.0055 + p.o) % 1;
      const base = [[-3.5, 10.8], [0, 12.2], [3.5, 11.2]][p.c];
      return <mesh key={i} position={[base[0] + t * 6 + p.x * (1 + t * 5), base[1] + t * 14, -1 - t * 3]} scale={0.5 + t * 3.2}>
        <sphereGeometry args={[1, 14, 14]} /><meshStandardMaterial color="#6a5a54" transparent opacity={(1 - t) * 0.34} roughness={1} depthWrite={false} />
      </mesh>;
    })}
  </ThreeCanvas>;
};

/** Le carrousel : l'étranger, la société-écran, l'acheteur. Des jetons tournent, la société peut disparaître. */
const Carrousel: React.FC<{p: number; d: number}> = ({p, d}) => {
  const f = useCurrentFrame();
  const t1 = useMemo(() => panneau('Étranger', 'achat hors taxe'), []);
  const t2 = useMemo(() => panneau('Société-écran', 'facture la TVA', '#F3DAD3'), []);
  const t3 = useMemo(() => panneau('Acheteur', 'en France'), []);
  const R = 5.2;
  const postes = [{a: Math.PI * 0.5 + 2.1, t: t1}, {a: Math.PI * 0.5, t: t2}, {a: Math.PI * 0.5 - 2.1, t: t3}];
  const pos = (a: number): [number, number] => [Math.cos(a) * R, Math.sin(a) * R];
  const disparue = p === 2 ? interpolate(f, [22, 44], [1, 0.02], clamp) : p === 3 ? 0.02 : 1;
  const vit = p === 3 ? 1.4 : 0.55;
  const n = p === 3 ? 7 : 3;
  return <AbsoluteFill>
    <ThreeCanvas width={1920} height={1080} shadows>
      <color attach="background" args={['#05070a']} />
      <Reflets force={0.2} />
      <Camera p={[Math.sin(f / 90) * 1.2, 11.5, 13.6 - interpolate(f, [0, d], [0, 0.6], clamp)]} c={[0, 0.4, 0.2]} fov={46} />
      <ambientLight intensity={1} />
      <spotLight position={[0, 13, 3]} angle={0.8} penumbra={0.8} intensity={520} color="#ffe6c2" castShadow />
      <pointLight position={[0, 2, 0]} intensity={p >= 2 ? 90 : 26} color="#ff2a18" distance={15} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow><planeGeometry args={[44, 44]} /><meshStandardMaterial color="#101317" metalness={0.5} roughness={0.5} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[R - 0.07, R + 0.07, 120]} /><meshBasicMaterial color={OR} /></mesh>
      {postes.map(({a, t}, i) => {
        const [x, z] = pos(a);
        const s = i === 1 ? disparue : 1;
        return <group key={i} position={[x, 0, z]} scale={[s, s, s]}>
          <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[2.3, 1.8, 2.3]} /><meshStandardMaterial color={i === 1 ? '#7a1c14' : '#3a4048'} metalness={0.6} roughness={0.38} /></mesh>
          <mesh position={[0, 2.9, 0]} rotation={[-0.42, 0, 0]}><planeGeometry args={[3.5, 1.32]} /><meshBasicMaterial map={t} side={THREE.DoubleSide} /></mesh>
        </group>;
      })}
      {Array.from({length: n}, (_, i) => {
        const a = (f / 30) * vit + (i / n) * Math.PI * 2;
        const [x, z] = pos(a);
        return <mesh key={i} position={[x, 0.42, z]} rotation={[0, -a, 0]} castShadow>
          <boxGeometry args={[0.66, 0.08, 0.92]} /><meshStandardMaterial color="#d8a12a" metalness={1} roughness={0.24} />
        </mesh>;
      })}
    </ThreeCanvas>
    <Etiquette>SCHÉMA DU CARROUSEL · ILLUSTRATION</Etiquette>
    {p === 2 && f > 42 ? <Tampon a={42} texte="DISPARUE" taille={84} style={{left: 700, top: 760}} /> : null}
  </AbsoluteFill>;
};

/** Le quota : un objet qui n'existe pas vraiment, une carte qui flotte. */
const Quota: React.FC = () => {
  const f = useCurrentFrame();
  const t = useMemo(() => panneau('1 quota', '= 1 tonne de CO2', '#F6F2E9'), []);
  return <ThreeCanvas width={1920} height={1080}>
    <color attach="background" args={['#06080b']} />
    <Reflets force={0.5} />
    <Camera p={[0, 0, 7.4]} c={[0, 0, 0]} />
    <ambientLight intensity={0.5} />
    <pointLight position={[3, 4, 4]} intensity={60} color="#ffe2b0" />
    <pointLight position={[-4, -2, 2]} intensity={34} color="#ff2a18" />
    <group rotation={[0.16 + Math.sin(f / 26) * 0.06, Math.sin(f / 38) * 0.55, Math.sin(f / 50) * 0.05]} position={[0, Math.sin(f / 22) * 0.1, 0]}>
      <mesh><boxGeometry args={[5, 1.9, 0.05]} /><meshStandardMaterial color="#c8922a" metalness={1} roughness={0.28} /></mesh>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[4.84, 1.76]} /><meshBasicMaterial map={t} /></mesh>
    </group>
    {Array.from({length: 40}, (_, i) => <mesh key={i} position={[(random(`qx${i}`) - 0.5) * 13, ((random(`qy${i}`) * 8 + f * 0.012) % 8) - 4, -2 - random(`qz${i}`) * 3]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color={OR} /></mesh>)}
  </ThreeCanvas>;
};

/** Une salle de marché générique, écrans allumés. Illustration, pas une capture de BlueNext. */
const Marche: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const tex = useMemo(() => Array.from({length: 4}, (_, s) => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 300;
    const x = c.getContext('2d')!;
    x.fillStyle = '#04100d'; x.fillRect(0, 0, 512, 300);
    x.strokeStyle = '#123a2e'; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, i * 50); x.lineTo(512, i * 50); x.stroke(); }
    x.strokeStyle = s % 2 ? '#ff5a45' : '#58d68d'; x.lineWidth = 4; x.beginPath();
    let y = 220;
    for (let i = 0; i <= 40; i++) { y += (random(`m${s}-${i}`) - 0.62) * 34; y = Math.max(20, Math.min(280, y)); if (i) x.lineTo(i * 12.8, y); else x.moveTo(0, y); }
    x.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }), []);
  const k = interpolate(f, [0, d], [0, 1], clamp);
  return <AbsoluteFill>
    <ThreeCanvas width={1920} height={1080}>
      <color attach="background" args={['#04060a']} />
      <Reflets force={0.1} />
      <Camera p={[-4.2 + k * 1.6, 2.1, 7.2 - k * 1.4]} c={[0.4, 0.8, -4]} fov={48} />
      <ambientLight intensity={0.7} />
      <pointLight position={[0, 3, 2]} intensity={60} color="#58d68d" distance={14} />
      <pointLight position={[-3, 3, -5]} intensity={40} color="#ff4530" distance={15} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, -5]}><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#0b0d11" metalness={0.6} roughness={0.32} /></mesh>
      {[0, -3.4, -6.8, -10.2].map((z, r) => <group key={z} position={[0, 0, z]}>
        <mesh position={[0, -0.25, 0.5]}><boxGeometry args={[13, 0.1, 1.4]} /><meshStandardMaterial color="#1b1f25" metalness={0.5} roughness={0.4} /></mesh>
        {Array.from({length: 7}, (_, i) => <group key={i} position={[-5.4 + i * 1.8, 0.45, 0]}>
          <mesh><boxGeometry args={[1.62, 1.02, 0.05]} /><meshStandardMaterial color="#090a0c" /></mesh>
          <mesh position={[0, 0, 0.03]}><planeGeometry args={[1.52, 0.92]} /><meshBasicMaterial map={tex[(i + r) % 4]} /></mesh>
        </group>)}
      </group>)}
    </ThreeCanvas>
    <Etiquette>SALLE DE MARCHÉ · ILLUSTRATION</Etiquette>
  </AbsoluteFill>;
};

/** Deux pays, une frontière, et les quotas qui font l'aller-retour. */
const Carte3D: React.FC = () => {
  const f = useCurrentFrame();
  const a = useMemo(() => panneau('France'), []);
  const b = useMemo(() => panneau('Autre pays'), []);
  return <ThreeCanvas width={1920} height={1080}>
    <color attach="background" args={['#05070c']} />
    <Reflets force={0.18} />
    <Camera p={[Math.sin(f / 80) * 1.2, 6.6, 12]} c={[0, 2.1, 0]} fov={46} />
    <ambientLight intensity={0.35} />
    <pointLight position={[-6, 6, 3]} intensity={90} color="#8fb4ef" />
    <pointLight position={[6, 6, 3]} intensity={90} color="#ff5a3a" />
    <gridHelper args={[40, 40, '#2b3442', '#171d26']} />
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.1, 30]} /><meshBasicMaterial color={ROUGE} /></mesh>
    {[{x: -6, t: a, c: '#49688c'}, {x: 6, t: b, c: '#7a3a2a'}].map(({x, t, c}) => <group key={x} position={[x, 0, 0]}>
      <mesh position={[0, 1.1, 0]}><boxGeometry args={[2.6, 2.2, 2.6]} /><meshStandardMaterial color={c} metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, 3.2, 0]} rotation={[-0.4, 0, 0]}><planeGeometry args={[4.4, 1.65]} /><meshBasicMaterial map={t} /></mesh>
    </group>)}
    {Array.from({length: 14}, (_, i) => {
      const t = (f * 0.022 + i / 14) % 1;
      const aller = i % 2 === 0;
      const x = aller ? -6 + t * 12 : 6 - t * 12;
      return <mesh key={i} position={[x, 0.7 + Math.sin(t * Math.PI) * 3.4, aller ? -0.5 : 0.5]} rotation={[f * 0.08, f * 0.05 + i, 0]}><boxGeometry args={[0.42, 0.05, 0.6]} /><meshStandardMaterial color="#d8a12a" metalness={1} roughness={0.25} /></mesh>;
    })}
  </ThreeCanvas>;
};

const Ligne: React.FC<{g: string; d: string; rouge?: boolean; fort?: boolean}> = ({g, d, rouge, fort}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', padding: '16px 18px', fontFamily: MONO, fontSize: 40, fontWeight: fort ? 600 : 400, color: rouge ? ROUGE : ENCRE, background: rouge ? 'rgba(210,43,31,.12)' : undefined}}><span>{g}</span><span>{d}</span></div>
);
/** La facture : le cœur de l'histoire, ligne par ligne. Montants d'exemple. */
const Facture: React.FC<V> = ({p}) => {
  const sansTva = p === 1 || p === 2 || p === 6;
  return <Fond f="gris"><Feuille w={1140} rot={-0.7}>
    <Sur>Facture · montants d'exemple</Sur>
    <Ligne g="Quotas de carbone" d="100,00 €" />
    <Ligne g={sansTva ? 'TVA' : 'TVA 19,6 %'} d={sansTva ? '0,00 €' : '19,60 €'} rouge={!sansTva} />
    <div style={{borderTop: `4px solid ${ENCRE}`, marginTop: 12}} />
    <Ligne g="Total" d={sansTva ? '100,00 €' : '119,60 €'} fort />
    {p === 4 ? <Entre a={10}><div style={{fontFamily: SERIF, fontSize: 48, marginTop: 28}}>L'acheteur récupère 19,60 € auprès de l'État.</div></Entre> : null}
    {p === 5 ? <Entre a={8}><div style={{fontFamily: SERIF, fontSize: 48, marginTop: 28}}>Le vendeur doit reverser 19,60 € au fisc.</div></Entre> : null}
    {p === 6 ? <Tampon a={10} texte="EXONÉRÉ" taille={72} style={{right: 60, bottom: 40}} /> : null}
    {p === 1 ? <Tampon a={10} texte="HORS TAXE" taille={64} style={{right: 60, bottom: 40}} /> : null}
  </Feuille></Fond>;
};

/** Un compteur d'euros : le chiffre fait le travail. */
const CompteurEuro: React.FC<V> = ({fin = 1600000000, l = "d'impôts disparus, selon la Cour des comptes", d}) => {
  const f = useCurrentFrame();
  const n = interpolate(f, [2, Math.max(12, d - 8)], [0, fin], {easing: Easing.out(Easing.cubic), ...clamp});
  return <Fond><div style={{textAlign: 'center'}}>
    <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 138, color: OR, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 40px ${OR}44`}}>{Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €</div>
    <div style={{fontFamily: MONO, fontSize: 30, color: DOUX, marginTop: 18}}>{l}</div>
  </div></Fond>;
};

Object.assign(DEUX_D, {facture: Facture, compteureur: CompteurEuro});

const Beat: React.FC<{v: V; d: number; i: number}> = ({v, d, i}) => {
  switch (v.t) {
    case 'usine': return <Usine d={d} />;
    case 'carrousel': return <Carrousel p={v.p} d={d} />;
    case 'quota': return <Quota />;
    case 'marche': return <Marche d={d} />;
    case 'carte3d': return <Carte3D />;
    default: return <Visuel v={v} d={d} i={i} />;
  }
};

export const LaFaille02: React.FC = () => (
  <DossierCtx.Provider value="lafaille02">
    <AbsoluteFill style={{backgroundColor: '#020203'}}>
      {plan.beats.map((b, i) => {
        const d = b.f - b.d;
        return <Sequence key={i} from={b.d} durationInFrames={d + 7} name={`${i} ${b.v.t}`}>
          <Fondu7><Beat v={b.v as V} d={d} i={i} /></Fondu7>
        </Sequence>;
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse, rgba(0,0,0,0) 62%, rgba(0,0,0,.34) 100%)', pointerEvents: 'none'}} />
      <Audio src={staticFile('lafaille02/mix.wav')} />
    </AbsoluteFill>
  </DossierCtx.Provider>
);
