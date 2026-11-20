import {loadFont as chargerSerif} from '@remotion/google-fonts/Newsreader';
import {loadFont as chargerMono} from '@remotion/google-fonts/IBMPlexMono';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Test d'accroche « Binance » : méthode Gloam, charte et texte propres, faits TRM Labs et Protos. */
const {fontFamily: SERIF} = chargerSerif('normal', {weights: ['500'], subsets: ['latin']});
const {fontFamily: MONO} = chargerMono('normal', {weights: ['400', '600'], subsets: ['latin']});

const PAPIER = '#EFE9DC';
const ENCRE = '#1A1A1C';
const ROUGE = '#D22B1F';
const OR = '#E0A92E';
export const DUREE_BINANCE_ACCROCHE = 710;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Fondu: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: interpolate(f, [0, 6], [0, 1], clamp)}}>{children}</AbsoluteFill>;
};

export const Etiquette: React.FC<{children: React.ReactNode; couleur?: string}> = ({children, couleur = '#C9C4B8'}) => (
  <div style={{position: 'absolute', left: 64, top: 52, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: couleur}}>{children}</div>
);

export const Tampon: React.FC<{a: number; texte: string; style?: React.CSSProperties; taille?: number}> = ({a, texte, style, taille = 64}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < a) return null;
  const s = spring({frame: f - a, fps, config: {damping: 14, stiffness: 260}});
  return (
    <div style={{position: 'absolute', fontFamily: MONO, fontWeight: 600, fontSize: taille, color: ROUGE, border: `6px solid ${ROUGE}`, padding: '6px 22px',
      borderRadius: 8, transform: `rotate(-7deg) scale(${interpolate(s, [0, 1], [1.7, 1])})`, opacity: Math.min(1, s * 1.5), ...style}}>{texte}</div>
  );
};

/** Environnement faible : sans lui, les métaux ne reflètent rien et ressortent noirs. */
export const Reflets: React.FC<{force?: number}> = ({force = 0.34}) => {
  const {gl, scene} = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = force;
  }, [gl, scene, force]);
  return null;
};

/** Caméra pilotée à l'image : position et cible interpolées par la scène. */
export const Camera: React.FC<{p: [number, number, number]; c: [number, number, number]; fov?: number}> = ({p, c, fov = 38}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...p);
  cam.fov = fov;
  cam.updateProjectionMatrix();
  cam.lookAt(...c);
  return null;
};

const textureCarreaux = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#2b3138';
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#0d0f12';
  x.lineWidth = 7;
  x.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14, 6);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Porte de coffre : anneau, disque, barillets et volant. */
export const Porte: React.FC<{position: [number, number, number]; ouverture: number}> = ({position, ouverture}) => {
  const acier = useMemo(() => new THREE.MeshStandardMaterial({color: '#8a9098', metalness: 0.95, roughness: 0.32}), []);
  const sombre = useMemo(() => new THREE.MeshStandardMaterial({color: '#23272c', metalness: 0.9, roughness: 0.45}), []);
  return (
    <group position={position}>
      <mesh material={sombre}><torusGeometry args={[1.62, 0.2, 24, 80]} /></mesh>
      <mesh position={[0, 0, -0.08]}><circleGeometry args={[1.5, 64]} /><meshBasicMaterial color="#020203" /></mesh>
      <group position={[-1.5, 0, 0.16]} rotation={[0, -ouverture, 0]}>
        <group position={[1.5, 0, 0]}>
          <mesh material={acier} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.42, 1.42, 0.26, 72]} /></mesh>
          <mesh material={sombre} position={[0, 0, 0.15]}><torusGeometry args={[1.05, 0.05, 14, 72]} /></mesh>
          <mesh material={sombre} position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 0.14, 40]} /></mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} material={acier} position={[0, 0, 0.3]} rotation={[0, 0, (i * Math.PI) / 4]}><boxGeometry args={[1.25, 0.07, 0.07]} /></mesh>
          ))}
          {Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <mesh key={i} material={acier} position={[Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.38, 16]} /></mesh>;
          })}
        </group>
      </group>
    </group>
  );
};

const PILES = 72;
/** Piles de pièces. `vidange` (0 à 1) les fait disparaître, et les pièces volent vers la porte. */
const Tresor: React.FC<{vidange: number}> = ({vidange}) => {
  const f = useCurrentFrame();
  const ref = useRef<THREE.InstancedMesh>(null);
  const vol = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.CylinderGeometry(0.17, 0.17, 0.045, 28), []);
  const or = useMemo(() => new THREE.MeshStandardMaterial({color: '#c8922a', metalness: 1, roughness: 0.24}), []);
  const piles = useMemo(() => Array.from({length: PILES}, (_, i) => ({
    x: -2.1 + (i % 12) * 0.46 + (random(`x${i}`) - 0.5) * 0.06,
    z: -0.95 + Math.floor(i / 12) * 0.42 + (random(`z${i}`) - 0.5) * 0.06,
    n: 8 + Math.floor(random(`n${i}`) * 26),
    retard: random(`r${i}`) * 0.45,
  })), []);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    let k = 0;
    if (ref.current) {
      for (const p of piles) {
        const reste = interpolate(vidange, [p.retard, p.retard + 0.5], [1, 0], clamp);
        for (let j = 0; j < Math.ceil(p.n * reste); j++) {
          m.position.set(p.x, 0.03 + j * 0.05, p.z);
          m.rotation.set(0, j, 0);
          m.updateMatrix();
          ref.current.setMatrixAt(k++, m.matrix);
        }
      }
      ref.current.count = k;
      ref.current.instanceMatrix.needsUpdate = true;
    }
    if (vol.current) {
      for (let i = 0; i < 260; i++) {
        const t = vidange <= 0 || vidange >= 1 ? -1 : ((vidange * 3 + random(`t${i}`)) % 1);
        const dep = piles[i % PILES];
        const hauteur = Math.sin(Math.max(t, 0) * Math.PI) * (0.5 + random(`h${i}`) * 0.9);
        m.position.set(
          t < 0 ? 0 : THREE.MathUtils.lerp(dep.x, -4.1, t),
          t < 0 ? -9 : 0.3 + hauteur,
          t < 0 ? 0 : THREE.MathUtils.lerp(dep.z, -1.8, t));
        m.rotation.set(f * 0.3 + i, i, f * 0.2);
        m.updateMatrix();
        vol.current.setMatrixAt(i, m.matrix);
      }
      vol.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh ref={ref} args={[geo, or, 2600]} castShadow />
      <instancedMesh ref={vol} args={[geo, or, 260]} />
    </>
  );
};

/** La salle des coffres, partagée par le plan du chrono et le gros plan final. */
export const Salle: React.FC<{vidange: number; ouverture: number; alarme: number}> = ({vidange, ouverture, alarme}) => {
  const carreaux = useMemo(textureCarreaux, []);
  return (
    <>
      <color attach="background" args={['#050608']} />
      <Reflets />
      <ambientLight intensity={0.16} color="#9fb4cc" />
      <spotLight position={[0.2, 5.4, 1.4]} angle={0.8} penumbra={0.65} intensity={300} color="#ffe2b0" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4.1, 1.2, -0.8]} intensity={18 + alarme * 90} distance={11} color="#ff2a18" />
      <pointLight position={[3.5, 2.5, 2]} intensity={45} distance={14} color="#7fa3cf" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} /><meshStandardMaterial color="#14171b" metalness={0.5} roughness={0.42} />
      </mesh>
      <mesh position={[0, 2, -2.25]}><planeGeometry args={[30, 7]} /><meshStandardMaterial map={carreaux} roughness={0.7} /></mesh>
      {[-3, 0, 3].map((x) => (
        <mesh key={x} position={[x, 4.6, 0.5]} rotation={[Math.PI / 2, 0, 0.3]}><planeGeometry args={[1.5, 0.06]} /><meshBasicMaterial color="#fff6df" side={THREE.DoubleSide} /></mesh>
      ))}
      <Porte position={[-4.3, 1.05, -2.05]} ouverture={ouverture} />
      <mesh position={[0.45, -0.52, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[6.1, 1, 3]} /><meshStandardMaterial color="#20242a" metalness={0.75} roughness={0.38} />
      </mesh>
      <Tresor vidange={vidange} />
    </>
  );
};

export const Chrono: React.FC<{secondes: number; vide: boolean}> = ({secondes, vide}) => {
  const m = Math.floor(secondes / 60);
  const s = Math.floor(secondes % 60);
  const a = (secondes / 60) * Math.PI * 2;
  return (
    <div style={{position: 'absolute', left: 88, top: 330, width: 300, height: 348, transform: 'rotate(-2deg)'}}>
      <div style={{position: 'absolute', left: 126, top: 0, width: 48, height: 30, background: '#b9b1a0', borderRadius: 5}} />
      <div style={{position: 'absolute', top: 26, width: 300, height: 300, borderRadius: 150, background: PAPIER, border: `10px solid ${ENCRE}`, boxSizing: 'border-box', boxShadow: '0 24px 60px rgba(0,0,0,.65)'}}>
        <svg width="280" height="280" style={{position: 'absolute'}}>
          {Array.from({length: 60}, (_, i) => {
            const t = (i / 60) * Math.PI * 2;
            const r2 = i % 5 === 0 ? 112 : 122;
            return <line key={i} x1={140 + Math.sin(t) * 130} y1={140 - Math.cos(t) * 130} x2={140 + Math.sin(t) * r2} y2={140 - Math.cos(t) * r2} stroke={ENCRE} strokeWidth={i % 5 === 0 ? 4 : 1.5} />;
          })}
          <line x1="140" y1="140" x2={140 + Math.sin(a) * 104} y2={140 - Math.cos(a) * 104} stroke={ROUGE} strokeWidth="5" strokeLinecap="round" />
          <circle cx="140" cy="140" r="9" fill={ROUGE} />
        </svg>
        <div style={{position: 'absolute', width: '100%', top: 176, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 42, color: ENCRE}}>{m}:{String(s).padStart(2, '0')}</div>
      </div>
      {vide ? <Tampon a={0} texte="VIDE" taille={60} style={{left: 62, top: 110, background: 'rgba(239,233,220,.88)'}} /> : null}
    </div>
  );
};

/** Plan 1 : la silhouette, l'écran, puis le reçu de la transaction. */
export const Silhouette: React.FC<{recu?: boolean; debut?: number}> = ({recu = true, debut = 42}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const code = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 1024;
    const x = c.getContext('2d')!;
    x.fillStyle = '#04100a'; x.fillRect(0, 0, 512, 1024);
    x.font = '15px monospace';
    for (let i = 0; i < 56; i++) {
      x.fillStyle = random(`c${i}`) > 0.84 ? '#ff5a45' : '#58d68d';
      x.fillText('0x' + Array.from({length: 8 + Math.floor(random(`l${i}`) * 26)}, (_, j) => Math.floor(random(`h${i}-${j}`) * 16).toString(16)).join(''), 14, 20 + i * 18);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 0.5);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  code.offset.y = (f * 0.004) % 1;
  const recul = interpolate(f, [0, 228], [8.2, 6.7], {easing: Easing.out(Easing.quad), ...clamp});
  const lignes: [string, string][] = [['DATE', '29 OCT. 2026'], ['HEURE', '21:20:59 PARIS'], ['RÉSEAU', 'ETHEREUM'], ['PORTEFEUILLE', 'BINANCE 14'], ['AUTORISATIONS', '50']];
  const entree = spring({frame: f - debut, fps, config: {damping: 19, stiffness: 90}});
  return (
    <AbsoluteFill style={{backgroundColor: '#020203'}}>
      <ThreeCanvas width={1920} height={1080} shadows={false}>
        <color attach="background" args={['#020203']} />
        <Camera p={[-1.7, 0.35, recul]} c={[-1.15, 0.1, 0]} />
        <ambientLight intensity={0.12} />
        <pointLight position={[-4.4, 2.6, -1.4]} intensity={260} color="#ff2412" distance={12} />
        <pointLight position={[-0.4, 0.6, -0.4]} intensity={9} color="#58d68d" distance={5} />
        <group position={[-2.35, -1.05, 0]} rotation={[0, 0.55, 0]}>
          <mesh position={[0, 1.62, 0]} scale={[0.86, 1.14, 0.95]}><sphereGeometry args={[0.72, 48, 48]} /><meshStandardMaterial color="#6b2a26" roughness={0.8} /></mesh>
          <mesh position={[0, 1.5, 0.42]} scale={[0.52, 0.72, 0.42]}><sphereGeometry args={[0.72, 40, 40]} /><meshBasicMaterial color="#010101" /></mesh>
          <mesh position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.9, 1]}><torusGeometry args={[0.56, 0.24, 20, 48]} /><meshStandardMaterial color="#5c2522" roughness={0.85} /></mesh>
          <mesh position={[0, -0.05, 0]} scale={[1.62, 1.2, 0.85]}><sphereGeometry args={[0.92, 48, 48]} /><meshStandardMaterial color="#54231f" roughness={0.85} /></mesh>
        </group>
        <mesh position={[0.25, 0.3, -1.1]} rotation={[0, -0.12, 0]}>
          <planeGeometry args={[1.6, 2.3]} /><meshBasicMaterial map={code} />
        </mesh>
      </ThreeCanvas>
      <Etiquette>JEUDI 29 OCTOBRE · SOIR</Etiquette>
      {recu ? <div style={{position: 'absolute', right: 150, top: interpolate(entree, [0, 1], [-640, 190]), width: 500, background: '#F6F2E9', color: ENCRE, fontFamily: MONO,
        padding: '34px 38px 42px', transform: 'rotate(1.4deg)', boxShadow: '0 34px 80px rgba(0,0,0,.75)',
        clipPath: 'polygon(0 0,100% 0,100% calc(100% - 12px),95% 100%,90% calc(100% - 12px),85% 100%,80% calc(100% - 12px),75% 100%,70% calc(100% - 12px),65% 100%,60% calc(100% - 12px),55% 100%,50% calc(100% - 12px),45% 100%,40% calc(100% - 12px),35% 100%,30% calc(100% - 12px),25% 100%,20% calc(100% - 12px),15% 100%,10% calc(100% - 12px),5% 100%,0 calc(100% - 12px))'}}>
        <div style={{textAlign: 'center', fontWeight: 600, fontSize: 25, letterSpacing: 3}}>REÇU DE TRANSACTION</div>
        <div style={{borderTop: `3px dashed ${ENCRE}`, margin: '20px 0 12px'}} />
        {lignes.map(([a, b], i) => (
          <div key={a} style={{display: 'flex', justifyContent: 'space-between', fontSize: 22, padding: '9px 0', opacity: interpolate(f, [debut + 10 + i * 12, debut + 16 + i * 12], [0, 1], clamp)}}><span>{a}</span><span>{b}</span></div>
        ))}
        <div style={{borderTop: `3px solid ${ENCRE}`, marginTop: 14, paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 30, color: ROUGE, opacity: interpolate(f, [debut + 83, debut + 90], [0, 1], clamp)}}>
          <span>TRANSACTIONS</span><span>1</span>
        </div>
      </div> : null}
    </AbsoluteFill>
  );
};

/** Plan 2 : le chrono avance, rien ne bouge, puis tout part d'un coup à 3:24. */
const PlanChrono: React.FC = () => {
  const f = useCurrentFrame();
  const secondes = interpolate(f, [8, 96], [0, 204], {easing: Easing.bezier(0.3, 0, 0.8, 1), ...clamp});
  const vidange = interpolate(f, [92, 118], [0, 1], clamp);
  const alarme = interpolate(f, [92, 104], [0, 1], clamp);
  const z = interpolate(f, [0, 136], [8.4, 7.7], clamp);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1920} height={1080} shadows>
        <Camera p={[1.4, 2.5 + Math.sin(f / 30) * 0.03, z]} c={[-0.65, 0.35, -0.8]} />
        <Salle vidange={vidange} ouverture={1.25} alarme={alarme} />
      </ThreeCanvas>
      <Chrono secondes={secondes} vide={f >= 116} />
      <Etiquette>21:20:59 → 21:24:23 · PARIS</Etiquette>
    </AbsoluteFill>
  );
};

/** Plan 3 : gros plan sur la porte, le chiffre total monte. */
const PlanTotal: React.FC = () => {
  const f = useCurrentFrame();
  const n = interpolate(f, [4, 58], [0, 6.3], {easing: Easing.out(Easing.cubic), ...clamp});
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1920} height={1080} shadows>
        <Camera p={[-4.25 + f * 0.002, 1.05, interpolate(f, [0, 72], [4.7, 3.9], clamp)]} c={[-4.3, 1.05, -2]} fov={42} />
        <Salle vidange={1} ouverture={1.3} alarme={1} />
      </ThreeCanvas>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle, rgba(0,0,0,.25) 0%, rgba(0,0,0,.72) 75%)'}}>
        <div style={{fontFamily: SERIF, fontWeight: 500, fontSize: 150, color: '#F6F2E9', fontVariantNumeric: 'tabular-nums'}}>{n.toFixed(1).replace('.', ',')} milliards $</div>
        <div style={{fontFamily: MONO, fontSize: 25, letterSpacing: 4, color: '#C9C4B8', marginTop: 8}}>SORTIS DE BINANCE EN QUELQUES HEURES</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Plan 4 : extrait télé encadré. Source créditée à l'écran. */
const PlanTele: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse, #24262b 0%, #060607 75%)', justifyContent: 'center', alignItems: 'center'}}>
      <Etiquette>ARCHIVE · FRANCE 24</Etiquette>
      <div style={{width: 1300, height: 731, border: '12px solid #F6F2E9', transform: `rotate(-1.4deg) scale(${interpolate(f, [0, 60], [1, 1.04])})`, boxShadow: '0 40px 90px rgba(0,0,0,.8)', overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile('binance_accroche/tv_extrait.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </AbsoluteFill>
  );
};

const Barre: React.FC<{nom: string; val: string; l: number; c: string; a: number}> = ({nom, val, l, c, a}) => (
  <div style={{marginBottom: 40}}>
    <div style={{fontFamily: MONO, fontSize: 24, color: '#57534b', marginBottom: 10}}>{nom}</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
      <div style={{height: 62, width: l * a, background: c}} />
      <div style={{fontFamily: SERIF, fontSize: 56, color: ENCRE, opacity: a}}>{val}</div>
    </div>
  </div>
);

/** Plan 5 : comparaison papier avec l'ancien record (Bybit, février 2025). */
const PlanRecord: React.FC = () => {
  const f = useCurrentFrame();
  const a = interpolate(f, [2, 22], [0, 1], {easing: Easing.out(Easing.cubic), ...clamp});
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse, #2b2d33 0%, #08090b 80%)', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'relative', width: 1380, height: 610, background: PAPIER, padding: '56px 70px', boxSizing: 'border-box', transform: 'rotate(-0.8deg)', boxShadow: '0 30px 80px rgba(0,0,0,.65)'}}>
        <div style={{fontFamily: MONO, fontSize: 25, letterSpacing: 3, color: '#57534b', marginBottom: 52}}>PLUS GROS VOLS DE CRYPTO CONNUS</div>
        <Barre nom="BINANCE · OCT. 2026" val="6,3 Md$" l={920} c={ROUGE} a={a} />
        <Barre nom="BYBIT · FÉV. 2025" val="1,5 Md$" l={219} c={ENCRE} a={a} />
        <Tampon a={18} texte="4× L'ANCIEN RECORD" taille={46} style={{right: 60, bottom: 54}} />
      </div>
    </AbsoluteFill>
  );
};

const Picto: React.FC<{type: 'porte' | 'garde' | 'personne'}> = ({type}) => (
  <svg width="320" height="320" viewBox="0 0 100 100" fill={ENCRE}>
    {type === 'porte' ? <><path d="M28 12h44v78H28z" /><circle cx="63" cy="52" r="4" fill={PAPIER} /></> : null}
    {type === 'garde' ? <><path d="M32 22l18-9 18 9v6H32z" /><circle cx="50" cy="38" r="11" /><path d="M28 90V63c0-8 7-13 22-13s22 5 22 13v27z" /></> : null}
    {type === 'personne' ? <><circle cx="50" cy="19" r="10" /><path d="M42 33h15l9 22-7 3-5-11-1 16 9 27h-8l-8-23-8 23h-8l8-27 1-19-6 10-6-4z" /></> : null}
  </svg>
);

export const Carte: React.FC<{debut: number; texte: string; type: 'porte' | 'garde' | 'personne'}> = ({debut, texte, type}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - debut, fps, config: {damping: 15, stiffness: 150}});
  const trait = interpolate(f, [debut + 13, debut + 21], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 660, top: 170, width: 600, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) rotate(-1.5deg) scale(${interpolate(s, [0, 1], [0.9, 1])})`, opacity: s}}>
      <div style={{position: 'relative', height: 440, background: PAPIER, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 28px 70px rgba(0,0,0,.7)'}}>
        <Picto type={type} />
        <svg width="600" height="440" style={{position: 'absolute', left: 0, top: 0}}>
          <line x1="130" y1="70" x2={130 + 340 * trait} y2={70 + 300 * trait} stroke={ROUGE} strokeWidth="20" strokeLinecap="round" opacity={trait > 0 ? 1 : 0} />
          <line x1="470" y1="70" x2={470 - 340 * trait} y2={70 + 300 * trait} stroke={ROUGE} strokeWidth="20" strokeLinecap="round" opacity={trait > 0 ? 1 : 0} />
        </svg>
      </div>
      <div style={{margin: '22px auto 0', width: 'fit-content', background: '#F6F2E9', color: ENCRE, fontFamily: MONO, fontWeight: 600, fontSize: 36, padding: '10px 26px'}}>{texte}</div>
    </div>
  );
};

/** Plan 6 : un couloir désert, et les trois négations. */
export const CouloirFond: React.FC = () => {
  const f = useCurrentFrame();
  const mur = useMemo(textureCarreaux, []);
  const z = interpolate(f, [0, 154], [11, 6], {easing: Easing.inOut(Easing.quad), ...clamp});
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1920} height={1080}>
        <color attach="background" args={['#020304']} />
        <Camera p={[0, 0.1, z]} c={[0, 0.25, -14]} fov={50} />
        <Reflets force={0.3} />
        <ambientLight intensity={0.35} />
        {[2, -3, -8, -13].map((zp) => <pointLight key={zp} position={[0, 2.1, zp]} intensity={48} distance={10} color="#bcd2ec" />)}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -6]}><planeGeometry args={[7, 44]} /><meshStandardMaterial color="#111317" metalness={0.5} roughness={0.35} /></mesh>
        {[-1, 1].map((c) => <mesh key={c} position={[c * 2.45, -1.49, -6]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.04, 44]} /><meshBasicMaterial color={OR} /></mesh>)}
        {[-1, 1].map((c) => <mesh key={c} position={[c * 3.4, 1, -6]} rotation={[0, -c * Math.PI / 2, 0]}><planeGeometry args={[44, 5.5]} /><meshStandardMaterial map={mur} roughness={0.65} /></mesh>)}
        <mesh position={[0, 3.2, -6]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[7, 44]} /><meshStandardMaterial color="#0a0b0d" /></mesh>
        {[3, -2, -7, -12, -17].map((zp) => <mesh key={zp} position={[0, 3.15, zp]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[0.14, 2.4]} /><meshBasicMaterial color="#f8fbff" side={THREE.DoubleSide} /></mesh>)}
        <Porte position={[0, 0.5, -17]} ouverture={0} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const PlanCouloir: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CouloirFond />
      {f < 54 ? <Carte debut={3} texte="AUCUNE PORTE FORCÉE" type="porte" /> : null}
      {f >= 54 && f < 87 ? <Carte debut={54} texte="AUCUN GARDE" type="garde" /> : null}
      {f >= 87 ? <Carte debut={87} texte="PERSONNE DANS LE BÂTIMENT" type="personne" /> : null}
    </AbsoluteFill>
  );
};

export const BinanceAccroche: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#020203'}}>
    <Sequence durationInFrames={228}><Silhouette /></Sequence>
    <Sequence from={228} durationInFrames={136}><Fondu><PlanChrono /></Fondu></Sequence>
    <Sequence from={364} durationInFrames={72}><Fondu><PlanTotal /></Fondu></Sequence>
    <Sequence from={436} durationInFrames={60}><Fondu><PlanTele /></Fondu></Sequence>
    <Sequence from={496} durationInFrames={60}><Fondu><PlanRecord /></Fondu></Sequence>
    <Sequence from={556} durationInFrames={154}><Fondu><PlanCouloir /></Fondu></Sequence>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse, rgba(0,0,0,0) 58%, rgba(0,0,0,.42) 100%)', pointerEvents: 'none'}} />
    <Audio src={staticFile('binance_accroche/guide.wav')} />
    <Audio src={staticFile('binance_accroche/ambiance.wav')} />
  </AbsoluteFill>
);
