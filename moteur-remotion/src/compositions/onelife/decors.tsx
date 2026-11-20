import {useThree} from '@react-three/fiber';
import {useMemo} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {hasard, useMat} from '../ile/outils3d';

/**
 * Décors et personnage de ONE LIFE. Low-poly à facettes, lumière chaude, ombres portées.
 * Tout est piloté par l'image courante : aucune animation n'a d'état propre.
 */
export type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ================================================================== personnage */

export type Pose = 'debout' | 'marche' | 'assis' | 'volant';
export type Humeur = 'neutre' | 'content' | 'triste';

export type PersoProps = {
  p: V3; rotY?: number; pose?: Pose; humeur?: Humeur; phase?: number; vitesse?: number;
  teteY?: number; teteX?: number; echelle?: number;
  peau?: string; cheveux?: string; haut?: string; bas?: string; chaussures?: string; capuche?: boolean;
  porte?: 'rien' | 'clipboard';
};

/** Ethan et les figurants. Origine = entre les pieds (debout) ; en pose assise, `p` est le point d'assise. */
export const Perso: React.FC<PersoProps> = ({
  p, rotY = 0, pose = 'debout', humeur = 'neutre', phase = 0, vitesse = 0.34, teteY = 0, teteX = 0, echelle = 1,
  peau = '#c98a5a', cheveux = '#2a1a10', haut = '#2f6db5', bas = '#28303d', chaussures = '#f2f2f2', capuche = true, porte = 'rien',
}) => {
  const frame = useCurrentFrame();
  const mPeau = useMat(peau), mCheveux = useMat(cheveux), mHaut = useMat(haut), mBas = useMat(bas), mChaus = useMat(chaussures);
  const mOeil = useMat('#1a1410', {roughness: 0.3}), mBlanc = useMat('#ffffff'), mBouche = useMat('#6a2a20'), mBois = useMat('#c9a26a'), mPapier = useMat('#f4f1e8');

  const H = 0.86; // hauteur de hanche
  const cyc = Math.sin(frame * vitesse + phase);
  const marche = pose === 'marche';
  const assis = pose === 'assis' || pose === 'volant';
  const hanche = (k: number) => (assis ? -Math.PI / 2 + 0.08 : marche ? k * cyc * 0.55 : 0);
  const genou = (k: number) => (assis ? Math.PI / 2 - 0.05 : marche ? Math.max(0, -k * cyc) * 0.9 : 0);
  const rebond = marche ? Math.abs(cyc) * 0.035 : 0;
  const souffle = Math.sin(frame / 22 + phase) * 0.008;
  const y0 = assis ? -H + 0.02 : rebond;

  const epaule = (k: number): [number, number] => {
    if (pose === 'volant') return [-1.15, -0.55];
    if (porte === 'clipboard' && k > 0) return [-0.9, -1.1];
    if (pose === 'assis') return [-0.55, -0.7];
    if (marche) return [-k * cyc * 0.5, -0.25];
    return humeur === 'triste' ? [0.05, -0.1] : [0, -0.12];
  };

  const triste = humeur === 'triste', content = humeur === 'content';
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={echelle}>
      <group position={[0, y0, 0]}>
        {/* jambes : hanche → genou → pied */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 0.12, H, 0]} rotation={[hanche(k), 0, 0]}>
            <mesh material={mBas} position={[0, -0.21, 0]} castShadow><boxGeometry args={[0.17, 0.44, 0.19]} /></mesh>
            <group position={[0, -0.43, 0]} rotation={[genou(k), 0, 0]}>
              <mesh material={mBas} position={[0, -0.19, 0]} castShadow><boxGeometry args={[0.155, 0.4, 0.17]} /></mesh>
              <mesh material={mChaus} position={[0, -0.4, 0.05]} castShadow><boxGeometry args={[0.18, 0.09, 0.3]} /></mesh>
            </group>
          </group>
        ))}
        {/* buste */}
        <group position={[0, souffle, 0]}>
          <mesh material={mHaut} position={[0, 1.18, 0]} castShadow><boxGeometry args={[0.52, 0.66, 0.29]} /></mesh>
          <mesh material={mHaut} position={[0, 0.88, 0]}><boxGeometry args={[0.5, 0.08, 0.27]} /></mesh>
          {capuche && <mesh material={mHaut} position={[0, 1.5, -0.13]} rotation={[0.35, 0, 0]}><boxGeometry args={[0.4, 0.16, 0.14]} /></mesh>}
          {capuche && [-1, 1].map((k) => <mesh key={k} material={mBlanc} position={[k * 0.07, 1.36, 0.15]}><boxGeometry args={[0.02, 0.18, 0.02]} /></mesh>)}
          {/* bras */}
          {[-1, 1].map((k) => {
            const [rx, coude] = epaule(k);
            return (
              <group key={k} position={[k * 0.33, 1.46, 0]} rotation={[rx, 0, k * 0.07]}>
                <mesh material={mHaut} position={[0, -0.17, 0]} castShadow><boxGeometry args={[0.15, 0.36, 0.16]} /></mesh>
                <group position={[0, -0.34, 0]} rotation={[coude, 0, 0]}>
                  <mesh material={mHaut} position={[0, -0.14, 0]}><boxGeometry args={[0.14, 0.3, 0.15]} /></mesh>
                  <mesh material={mPeau} position={[0, -0.33, 0]}><icosahedronGeometry args={[0.075, 0]} /></mesh>
                  {porte === 'clipboard' && k > 0 && (
                    <group position={[0, -0.36, 0.08]} rotation={[0.6, 0, 0]}>
                      <mesh material={mBois}><boxGeometry args={[0.24, 0.02, 0.32]} /></mesh>
                      <mesh material={mPapier} position={[0, 0.012, 0]}><boxGeometry args={[0.2, 0.005, 0.26]} /></mesh>
                    </group>
                  )}
                </group>
              </group>
            );
          })}
          {/* cou + tête */}
          <mesh material={mPeau} position={[0, 1.55, 0]}><cylinderGeometry args={[0.07, 0.08, 0.1, 8]} /></mesh>
          <group position={[0, 1.76, 0]} rotation={[teteX + (triste ? 0.22 : 0), teteY, 0]}>
            <mesh material={mPeau}><icosahedronGeometry args={[0.22, 1]} /></mesh>
            {/* cheveux : calotte + frange */}
            <mesh material={mCheveux} position={[0, 0.05, -0.02]}><sphereGeometry args={[0.232, 14, 8, 0, Math.PI * 2, 0, 1.25]} /></mesh>
            <mesh material={mCheveux} position={[0.03, 0.15, 0.15]} rotation={[0.5, 0, -0.25]}><boxGeometry args={[0.3, 0.08, 0.12]} /></mesh>
            {/* yeux, sourcils, nez, bouche */}
            {[-1, 1].map((k) => (
              <group key={k}>
                <mesh material={mBlanc} position={[k * 0.08, 0.02, 0.19]}><sphereGeometry args={[0.042, 10, 8]} /></mesh>
                <mesh material={mOeil} position={[k * 0.08, 0.015, 0.222]}><sphereGeometry args={[0.025, 10, 8]} /></mesh>
                <mesh material={mCheveux} position={[k * 0.08, 0.085, 0.205]} rotation={[0, 0, k * (triste ? 0.32 : content ? -0.12 : 0.05)]}><boxGeometry args={[0.075, 0.018, 0.02]} /></mesh>
              </group>
            ))}
            <mesh material={mPeau} position={[0, -0.03, 0.215]}><icosahedronGeometry args={[0.03, 0]} /></mesh>
            {content
              ? <mesh material={mBouche} position={[0, -0.1, 0.2]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.045, 0.012, 6, 12, Math.PI]} /></mesh>
              : triste
                ? <mesh material={mBouche} position={[0, -0.125, 0.2]}><torusGeometry args={[0.04, 0.011, 6, 12, Math.PI]} /></mesh>
                : <mesh material={mBouche} position={[0, -0.11, 0.205]}><boxGeometry args={[0.07, 0.014, 0.01]} /></mesh>}
          </group>
        </group>
      </group>
    </group>
  );
};

/* ================================================================== objets communs */

export const Arbre: React.FC<{p: V3; s?: number; graine?: number}> = ({p, s = 1, graine = 1}) => {
  const frame = useCurrentFrame();
  const tronc = useMat('#7a5232');
  const teinte = ['#4fa35a', '#5cae4e', '#3f8f4f', '#6bb85a'][Math.floor(hasard(graine) * 4)];
  const feuilles = useMat(teinte);
  const vent = Math.sin(frame / 40 + graine) * 0.03;
  return (
    <group position={p} scale={s}>
      <mesh material={tronc} position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.13, 0.19, 1.6, 6]} /></mesh>
      <group rotation={[0, 0, vent]}>
        <mesh material={feuilles} position={[0, 2.25, 0]} castShadow><icosahedronGeometry args={[1.0, 0]} /></mesh>
        <mesh material={feuilles} position={[0.45, 1.85, 0.2]} castShadow><icosahedronGeometry args={[0.6, 0]} /></mesh>
      </group>
    </group>
  );
};

export const Maison: React.FC<{p: V3; mur: string; toit: string; rot?: number; nuit?: number}> = ({p, mur, toit, rot = 0, nuit = 0}) => {
  const mMur = useMat(mur), mToit = useMat(toit), mPorte = useMat('#6b4a2a'), mBlanc = useMat('#f4f1ea');
  const vitre = useMemo(() => new THREE.MeshStandardMaterial({color: '#9fc8e0', emissive: new THREE.Color('#ffc870'), emissiveIntensity: 0, roughness: 0.2}), []);
  vitre.emissiveIntensity = nuit * 1.3;
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <mesh material={mMur} position={[0, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[5, 3, 4]} /></mesh>
      <mesh material={mToit} position={[0, 3.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[4.1, 1.6, 4]} /></mesh>
      <mesh material={mPorte} position={[0, 0.9, 2.01]}><boxGeometry args={[0.9, 1.8, 0.06]} /></mesh>
      <mesh material={mBlanc} position={[0, 0.06, 2.4]}><boxGeometry args={[1.6, 0.12, 0.8]} /></mesh>
      {[-1.6, 1.6].map((x) => (
        <group key={x}>
          <mesh material={vitre} position={[x, 1.75, 2.01]}><boxGeometry args={[1, 0.9, 0.05]} /></mesh>
          <mesh material={mBlanc} position={[x, 1.75, 2.03]}><boxGeometry args={[1.08, 0.06, 0.04]} /></mesh>
        </group>
      ))}
    </group>
  );
};

/** Voiture compacte. Vitres semi-transparentes : on voit le conducteur. */
export const Voiture: React.FC<{p: V3; rotY?: number; couleur: string; phares?: number; children?: React.ReactNode}> = ({p, rotY = 0, couleur, phares = 0, children}) => {
  const carrosserie = useMat(couleur, {roughness: 0.45});
  const pneu = useMat('#141414'), jante = useMat('#b9bec4', {roughness: 0.3});
  const vitre = useMemo(() => new THREE.MeshStandardMaterial({color: '#203040', transparent: true, opacity: 0.32, roughness: 0.1}), []);
  const avant = useMemo(() => new THREE.MeshStandardMaterial({color: '#fffbe8', emissive: new THREE.Color('#fff2c8'), emissiveIntensity: 0.2}), []);
  const arriere = useMemo(() => new THREE.MeshStandardMaterial({color: '#5a0a0a', emissive: new THREE.Color('#ff2a2a'), emissiveIntensity: 0.2}), []);
  avant.emissiveIntensity = 0.2 + phares * 3;
  arriere.emissiveIntensity = 0.2 + phares * 1.6;
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh material={carrosserie} position={[0, 0.6, 0]} castShadow><boxGeometry args={[1.8, 0.55, 4.1]} /></mesh>
      <mesh material={carrosserie} position={[0, 1.08, -0.25]}><boxGeometry args={[1.66, 0.06, 2.0]} /></mesh>
      {[[-0.82, 0.62], [0.82, 0.62], [-0.82, -1.12], [0.82, -1.12]].map(([x, z], i) => (
        <mesh key={`m${i}`} material={carrosserie} position={[x, 0.98, z]}><boxGeometry args={[0.08, 0.5, 0.08]} /></mesh>
      ))}
      <mesh material={vitre} position={[0, 1.0, -0.25]}><boxGeometry args={[1.64, 0.42, 1.95]} /></mesh>
      {[[-0.82, 1.3], [0.82, 1.3], [-0.82, -1.3], [0.82, -1.3]].map(([x, z], i) => (
        <group key={i} position={[x, 0.34, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={pneu}><cylinderGeometry args={[0.34, 0.34, 0.26, 12]} /></mesh>
          <mesh material={jante}><cylinderGeometry args={[0.18, 0.18, 0.28, 8]} /></mesh>
        </group>
      ))}
      {[-0.6, 0.6].map((x) => <mesh key={x} material={avant} position={[x, 0.68, 2.06]}><boxGeometry args={[0.4, 0.15, 0.04]} /></mesh>)}
      {[-0.66, 0.66].map((x) => <mesh key={x} material={arriere} position={[x, 0.7, -2.06]}><boxGeometry args={[0.34, 0.13, 0.04]} /></mesh>)}
      {phares > 0.05 && <pointLight position={[0, 0.8, 3.4]} intensity={30 * phares} distance={12} color="#fff1cc" />}
      {children}
    </group>
  );
};

const Cone: React.FC<{p: V3}> = ({p}) => {
  const orange = useMat('#ff7a1a'), blanc = useMat('#ffffff');
  return (
    <group position={p}>
      <mesh material={orange} position={[0, 0.35, 0]} castShadow><coneGeometry args={[0.2, 0.7, 10]} /></mesh>
      <mesh material={blanc} position={[0, 0.38, 0]}><cylinderGeometry args={[0.105, 0.125, 0.09, 10]} /></mesh>
      <mesh material={orange} position={[0, 0.02, 0]}><boxGeometry args={[0.46, 0.04, 0.46]} /></mesh>
    </group>
  );
};

/** Panneau texte dessiné sur canvas (enseignes). */
const Enseigne: React.FC<{p: V3; texte: string; l: number; h: number; fond: string; encre: string; police?: number; lumineux?: number}> = ({
  p, texte, l, h, fond, encre, police = 120, lumineux = 0,
}) => {
  const mat = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round((1024 * h) / l);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = fond; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = encre; ctx.font = `900 ${police}px Montserrat, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(texte, c.width / 2, c.height / 2 + police * 0.05);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return new THREE.MeshStandardMaterial({map: t, emissiveMap: t, emissive: new THREE.Color('#ffffff'), emissiveIntensity: lumineux, roughness: 0.6});
  }, [texte, l, h, fond, encre, police, lumineux]);
  return <mesh material={mat} position={p}><boxGeometry args={[l, h, 0.08]} /></mesh>;
};

/* ================================================================== ciel & lumière */

const textureDegrade = (stops: [number, string][]) => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

const CIEL_JOUR: [number, string][] = [[0, '#5f9fd8'], [0.55, '#a9d2ef'], [0.8, '#f3d9b0'], [1, '#f6c48e']];
const CIEL_NUIT: [number, string][] = [[0, '#060a1e'], [0.6, '#16204a'], [0.9, '#2c2f5e'], [1, '#3a3260']];

const Ambiance: React.FC<{nuit: boolean; brume?: [number, number]}> = ({nuit, brume = [30, 90]}) => {
  const {scene} = useThree();
  const jour = useMemo(() => textureDegrade(CIEL_JOUR), []);
  const soir = useMemo(() => textureDegrade(CIEL_NUIT), []);
  scene.background = nuit ? soir : jour;
  scene.fog = new THREE.Fog(nuit ? '#141a38' : '#f0d6b4', brume[0], brume[1]);
  return nuit ? (
    <>
      <hemisphereLight args={['#4a5a9a', '#101018', 0.45]} />
      <directionalLight position={[-20, 30, -10]} intensity={0.35} color="#9fb4ff" />
    </>
  ) : (
    <>
      <hemisphereLight args={['#dff0ff', '#7a8a5a', 0.95]} />
      <directionalLight position={[14, 9, 8]} intensity={2.6} color="#ffd9a8" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004}
        shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-camera-far={60} />
    </>
  );
};

const Etoiles: React.FC = () => {
  const {geo, mat} = useMemo(() => {
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = hasard(i * 1.7) * Math.PI * 2, el = 0.2 + hasard(i * 2.9) * 1.3, r = 200;
      pos[i * 3] = Math.cos(a) * Math.cos(el) * r; pos[i * 3 + 1] = Math.sin(el) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return {geo: g, mat: new THREE.PointsMaterial({color: '#ffffff', size: 2.4, sizeAttenuation: false, fog: false})};
  }, []);
  return <points geometry={geo} material={mat} />;
};

/* ================================================================== décors */

/** Chambre d'Ethan. `nuit` : lampe de bureau allumée, fenêtre bleu nuit. */
const Chambre: React.FC<{nuit: boolean}> = ({nuit}) => {
  const {scene} = useThree();
  scene.background = new THREE.Color(nuit ? '#0b1026' : '#cfe6f5');
  scene.fog = null;
  const parquet = useMat('#b98a5a'), mur = useMat(nuit ? '#5a6488' : '#e9dcc4'), mur2 = useMat(nuit ? '#4c5578' : '#dfd0b6');
  const lit = useMat('#6a4a32'), drap = useMat('#e8eef5'), couette = useMat('#d84a3a'), oreiller = useMat('#ffffff');
  const bureau = useMat('#8a6a4a'), noir = useMat('#20232a'), tapis = useMat('#3a6a8a');
  const p1 = useMat('#f2b134'), p2 = useMat('#3aa0d8'), p3 = useMat('#2c2c34');
  const fenetre = useMemo(() => new THREE.MeshStandardMaterial({color: '#bfe4ff', emissive: new THREE.Color(nuit ? '#1a2a5a' : '#fff4dc'), emissiveIntensity: nuit ? 0.6 : 1.4}), [nuit]);
  const ampoule = useMemo(() => new THREE.MeshStandardMaterial({color: '#fff', emissive: new THREE.Color('#ffcf80'), emissiveIntensity: nuit ? 3 : 0}), [nuit]);
  return (
    <group>
      <hemisphereLight args={[nuit ? '#5a6aa8' : '#fff6e8', '#3a2a1a', nuit ? 0.5 : 1.1]} />
      <pointLight position={[1.5, 2.2, 2.5]} intensity={nuit ? 2 : 6} distance={9} color={nuit ? '#8fa0ff' : '#fff2e0'} />
      {nuit
        ? <pointLight position={[2.1, 1.6, -1.4]} intensity={9} distance={8} color="#ffbf70" castShadow />
        : <directionalLight position={[-6, 5, 1]} intensity={2.4} color="#fff0d6" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
            shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />}
      <mesh material={parquet} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[9, 9]} /></mesh>
      <mesh material={tapis} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.6]} receiveShadow><circleGeometry args={[1.3, 24]} /></mesh>
      <mesh material={mur} position={[0, 1.6, -2.6]} receiveShadow><boxGeometry args={[9, 3.2, 0.1]} /></mesh>
      <mesh material={mur2} position={[-3.2, 1.6, 0]} receiveShadow><boxGeometry args={[0.1, 3.2, 9]} /></mesh>
      <mesh material={fenetre} position={[-3.14, 1.8, -0.4]}><boxGeometry args={[0.04, 1.2, 1.5]} /></mesh>
      <mesh material={lit} position={[-1.2, 0.25, -1.2]} castShadow receiveShadow><boxGeometry args={[1.5, 0.5, 2.3]} /></mesh>
      <mesh material={drap} position={[-1.2, 0.56, -1.2]} receiveShadow><boxGeometry args={[1.4, 0.14, 2.2]} /></mesh>
      <mesh material={couette} position={[-1.2, 0.66, -1.35]} castShadow><boxGeometry args={[1.45, 0.1, 1.3]} /></mesh>
      <mesh material={oreiller} position={[-1.2, 0.72, -2.0]}><boxGeometry args={[0.9, 0.16, 0.45]} /></mesh>
      <mesh material={lit} position={[-1.2, 0.8, -2.36]}><boxGeometry args={[1.5, 1.1, 0.1]} /></mesh>
      <mesh material={bureau} position={[1.9, 0.75, -2.1]} castShadow receiveShadow><boxGeometry args={[1.6, 0.06, 0.8]} /></mesh>
      {[[1.2, -1.8], [2.6, -1.8], [1.2, -2.4], [2.6, -2.4]].map(([x, z], i) => <mesh key={i} material={bureau} position={[x, 0.37, z]}><boxGeometry args={[0.06, 0.74, 0.06]} /></mesh>)}
      <mesh material={noir} position={[1.7, 1.02, -2.3]}><boxGeometry args={[0.7, 0.45, 0.04]} /></mesh>
      <mesh material={noir} position={[2.4, 0.95, -2.2]}><cylinderGeometry args={[0.02, 0.02, 0.38, 6]} /></mesh>
      <mesh material={ampoule} position={[2.35, 1.16, -2.12]} rotation={[0.5, 0, 0]}><coneGeometry args={[0.1, 0.14, 10, 1, true]} /></mesh>
      {[p1, p2, p3].map((m, i) => <mesh key={i} material={m} position={[-0.2 + i * 0.75, 2.1, -2.54]}><boxGeometry args={[0.55, 0.75, 0.02]} /></mesh>)}
    </group>
  );
};

/** Rue pavillonnaire en fin d'après-midi. */
const Rue: React.FC<{f: number; debut: number}> = ({f, debut}) => {
  const herbe = useMat('#86c06a'), route = useMat('#575a60'), trottoir = useMat('#d4cfc4'), ligne = useMat('#f2e6b8'), boite = useMat('#3a5a8a');
  const voitureX = interpolate(f - debut, [40, 170], [-40, 40], clamp);
  return (
    <group>
      <Ambiance nuit={false} brume={[35, 110]} />
      <mesh material={herbe} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[220, 220]} /></mesh>
      <mesh material={route} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4.5]} receiveShadow><planeGeometry args={[220, 6]} /></mesh>
      {Array.from({length: 28}, (_, i) => <mesh key={i} material={ligne} rotation={[-Math.PI / 2, 0, 0]} position={[-55 + i * 4, 0.02, 4.5]}><planeGeometry args={[2, 0.15]} /></mesh>)}
      <mesh material={trottoir} position={[0, 0.07, 0.8]} receiveShadow><boxGeometry args={[220, 0.14, 1.8]} /></mesh>
      <mesh material={trottoir} position={[0, 0.07, 8.2]} receiveShadow><boxGeometry args={[220, 0.14, 1.8]} /></mesh>
      {[-22, -11, 0, 11, 22, 33].map((x, i) => (
        <Maison key={x} p={[x, 0, -4.5]} mur={['#f3e3c3', '#cfe0f0', '#f0d0d6', '#e6e6d6', '#f6e7b8', '#d9e8d0'][i]} toit={['#c2563f', '#4a5d7a', '#7a4a4a', '#5a7a4a', '#a04a2a', '#5a5a6a'][i]} />
      ))}
      {[-16, -5, 5.5, 16.5, 27.5].map((x, i) => <Arbre key={x} p={[x, 0, -0.9]} s={0.95 + hasard(i) * 0.3} graine={i + 3} />)}
      {[-18, 3, 24].map((x) => (
        <group key={x} position={[x + 2.6, 0, -0.4]}>
          <mesh material={trottoir} position={[0, 0.55, 0]}><boxGeometry args={[0.08, 1.1, 0.08]} /></mesh>
          <mesh material={boite} position={[0, 1.15, 0]}><boxGeometry args={[0.3, 0.3, 0.5]} /></mesh>
        </group>
      ))}
      <Voiture p={[-8, 0, -1.9]} rotY={Math.PI / 2} couleur="#d8d8d8" />
      <Voiture p={[voitureX, 0, 6]} rotY={Math.PI / 2} couleur="#c0392b" />
      <Perso p={[14, 0, -1.6]} rotY={-0.6} haut="#6a8a3a" bas="#3a3a3a" peau="#e9b27d" cheveux="#8a6a3a" capuche={false} humeur="content" />
    </group>
  );
};

/** Parking du centre d'examen : slalom entre les cônes. */
const Examen: React.FC<{f: number; debut: number}> = ({f, debut}) => {
  const asphalte = useMat('#4c4f55'), blanc = useMat('#eeeeea'), murDMV = useMat('#d8d2c4'), toitDMV = useMat('#6a6e78'), herbe = useMat('#86c06a');
  const t = Math.max(0, f - debut);
  const z = interpolate(t, [0, 260], [-10, 8], clamp);
  const x = Math.sin(z * 0.75) * 1.6;
  const cap = Math.atan2(Math.cos(z * 0.75) * 1.6 * 0.75, 1);
  return (
    <group>
      <Ambiance nuit={false} brume={[40, 120]} />
      <mesh material={herbe} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[220, 220]} /></mesh>
      <mesh material={asphalte} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><planeGeometry args={[40, 40]} /></mesh>
      {Array.from({length: 9}, (_, i) => <mesh key={i} material={blanc} rotation={[-Math.PI / 2, 0, 0]} position={[-8 + i * 2, 0.02, -14]}><planeGeometry args={[0.1, 5]} /></mesh>)}
      {[-6.3, -2.1, 2.1, 6.3].map((cz, i) => <Cone key={cz} p={[i % 2 === 0 ? 0.35 : -0.35, 0.01, cz]} />)}
      <Voiture p={[x, 0, z]} rotY={cap} couleur="#2e86de">
        <Perso p={[-0.42, 0.45, -0.1]} pose="volant" humeur="neutre" echelle={0.92} />
      </Voiture>
      <group position={[-9, 0, -12]}>
        <mesh material={murDMV} position={[0, 2, 0]} castShadow receiveShadow><boxGeometry args={[12, 4, 6]} /></mesh>
        <mesh material={toitDMV} position={[0, 4.15, 0]}><boxGeometry args={[12.4, 0.3, 6.4]} /></mesh>
        <Enseigne p={[0, 3.2, 3.05]} texte="DRIVER TESTING" l={6} h={0.9} fond="#1f3f6a" encre="#ffffff" police={110} />
      </group>
      <Perso p={[3.4, 0.01, 1.5]} rotY={-1.2} haut="#f2f2ee" bas="#2a2f3a" peau="#a8714a" cheveux="#1a1410" capuche={false} porte="clipboard" />
    </group>
  );
};

/** Fast-food : Ethan va jusqu'à la porte (« NOW HIRING »), puis repart tête basse si refus. */
const Burger: React.FC<{f: number; debut: number; refus: number}> = ({f, debut, refus}) => {
  const asphalte = useMat('#5a5d63'), mur = useMat('#f4ece0'), rouge = useMat('#d63a2a'), blanc = useMat('#ffffff'), vitre = useMat('#a8d0e6', {roughness: 0.1}), herbe = useMat('#86c06a');
  const t = f - debut;
  const allerZ = interpolate(t, [0, 110], [6.5, 2.6], clamp);
  const repart = refus > 0 ? interpolate(f, [refus, refus + 90], [0, 1], clamp) : 0;
  const z = allerZ + repart * 4;
  const marche = (t < 110 && t > 0) || (repart > 0 && repart < 1);
  return (
    <group>
      <Ambiance nuit={false} brume={[40, 120]} />
      <mesh material={herbe} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[220, 220]} /></mesh>
      <mesh material={asphalte} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 6]} receiveShadow><planeGeometry args={[40, 16]} /></mesh>
      <group position={[0, 0, -2]}>
        <mesh material={mur} position={[0, 2, 0]} castShadow receiveShadow><boxGeometry args={[10, 4, 6]} /></mesh>
        <mesh material={rouge} position={[0, 4.2, 0]}><boxGeometry args={[10.4, 0.4, 6.4]} /></mesh>
        {Array.from({length: 10}, (_, i) => (
          <mesh key={i} material={i % 2 ? blanc : rouge} position={[-4.5 + i, 3.15, 3.35]} rotation={[0.45, 0, 0]}><boxGeometry args={[1, 0.05, 0.9]} /></mesh>
        ))}
        <mesh material={vitre} position={[-2.6, 1.5, 3.01]}><boxGeometry args={[3.4, 2, 0.05]} /></mesh>
        <mesh material={vitre} position={[2.6, 1.5, 3.01]}><boxGeometry args={[3.4, 2, 0.05]} /></mesh>
        <mesh material={vitre} position={[0, 1.15, 3.01]}><boxGeometry args={[1.2, 2.3, 0.05]} /></mesh>
        <Enseigne p={[0, 5.1, 2.6]} texte="BURGERS" l={5} h={1.2} fond="#d63a2a" encre="#ffe9a8" police={170} />
        <Enseigne p={[2.6, 1.6, 3.06]} texte="NOW HIRING" l={2.2} h={0.55} fond="#ffffff" encre="#d63a2a" police={130} />
      </group>
      <Perso p={[0.6, 0.01, z]} rotY={repart > 0 ? 0 : Math.PI} pose={marche ? 'marche' : 'debout'} humeur={repart > 0 ? 'triste' : 'neutre'} />
    </group>
  );
};

/** Route de nuit : la voiture d'Ethan roule, des amis à bord, lampadaires qui défilent. */
const RouteNuit: React.FC<{f: number; debut: number}> = ({f, debut}) => {
  const asphalte = useMat('#2a2c32'), ligne = useMat('#e8d890'), metal = useMat('#3a3d44'), herbe = useMat('#1e2a24');
  const lampe = useMemo(() => new THREE.MeshStandardMaterial({color: '#fff', emissive: new THREE.Color('#ffc870'), emissiveIntensity: 2.5}), []);
  const z = Math.max(0, f - debut) * 0.32;
  return (
    <group>
      <Ambiance nuit brume={[20, 70]} />
      <hemisphereLight args={['#5a6aaa', '#202030', 0.35]} />
      <Etoiles />
      <mesh material={herbe} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 60]}><planeGeometry args={[220, 300]} /></mesh>
      <mesh material={asphalte} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 60]} receiveShadow><planeGeometry args={[9, 300]} /></mesh>
      {Array.from({length: 50}, (_, i) => <mesh key={i} material={ligne} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -20 + i * 6]}><planeGeometry args={[0.15, 2.6]} /></mesh>)}
      {Array.from({length: 14}, (_, i) => {
        const lz = -10 + i * 16;
        const proche = Math.abs(lz - z - 6) < 22;
        return (
          <group key={i} position={[5.2, 0, lz]}>
            <mesh material={metal} position={[0, 3, 0]}><cylinderGeometry args={[0.08, 0.1, 6, 6]} /></mesh>
            <mesh material={metal} position={[-0.8, 5.95, 0]}><boxGeometry args={[1.7, 0.1, 0.1]} /></mesh>
            <mesh material={lampe} position={[-1.5, 5.85, 0]}><boxGeometry args={[0.6, 0.12, 0.3]} /></mesh>
            {proche && <pointLight position={[-1.5, 5.4, 0]} intensity={22} distance={14} color="#ffc870" />}
          </group>
        );
      })}
      <Voiture p={[-1.9, 0, z]} couleur="#2e86de" phares={1}>
        <Perso p={[-0.42, 0.45, -0.1]} pose="volant" humeur="content" echelle={0.92} />
        <Perso p={[0.42, 0.45, -0.1]} pose="assis" humeur="content" echelle={0.92} haut="#e84a5f" peau="#e9b27d" cheveux="#c8902a" capuche={false} teteY={-0.4} />
        <Perso p={[0, 0.45, -1.1]} pose="assis" humeur="content" echelle={0.92} haut="#47c46a" peau="#8a5a3b" cheveux="#1a1410" capuche={false} />
      </Voiture>
    </group>
  );
};

/** Pick-up : plus haut et plus long que la voiture d'Ethan, gros phares. */
export const Pickup: React.FC<{p: V3; rotY?: number; couleur?: string}> = ({p, rotY = 0, couleur = '#8a8f96'}) => {
  const carrosserie = useMat(couleur, {roughness: 0.5}), noir = useMat('#141414'), chrome = useMat('#c9cdd2', {roughness: 0.25});
  const vitre = useMemo(() => new THREE.MeshStandardMaterial({color: '#1a2230', roughness: 0.1}), []);
  const phare = useMemo(() => new THREE.MeshStandardMaterial({color: '#fffbe8', emissive: new THREE.Color('#fff4d0'), emissiveIntensity: 4}), []);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh material={carrosserie} position={[0, 0.85, 0.2]} castShadow><boxGeometry args={[2.1, 0.75, 5.4]} /></mesh>
      <mesh material={carrosserie} position={[0, 1.55, 0.9]} castShadow><boxGeometry args={[2.0, 0.75, 2.0]} /></mesh>
      <mesh material={vitre} position={[0, 1.6, 1.92]}><boxGeometry args={[1.85, 0.6, 0.05]} /></mesh>
      <mesh material={chrome} position={[0, 0.75, 2.95]}><boxGeometry args={[2.0, 0.35, 0.12]} /></mesh>
      {[[-0.95, 1.7], [0.95, 1.7], [-0.95, -1.5], [0.95, -1.5]].map(([x, z], i) => (
        <mesh key={i} material={noir} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.45, 0.45, 0.32, 12]} /></mesh>
      ))}
      {[-0.7, 0.7].map((x) => <mesh key={x} material={phare} position={[x, 1.0, 2.93]}><boxGeometry args={[0.45, 0.22, 0.05]} /></mesh>)}
      <pointLight position={[0, 1.0, 4.5]} intensity={60} distance={18} color="#fff1cc" />
    </group>
  );
};

/** Carrefour de nuit. `ts` = temps de la scène en secondes (ralenti et arrêt sur image gérés par l'appelant).
 *  La voiture d'Ethan arrive par -z et pile ; le pick-up arrive par +x en grillant le rouge et passe juste devant. */
export const voitureZ = (ts: number) => {
  const tFrein = 2.73, v = 9;
  if (ts < tFrein) return -30 + v * ts;
  const d = Math.min(ts - tFrein, 0.9);
  return -30 + v * tFrein + v * (d - (d * d) / 1.8); // décélération jusqu'à l'arrêt en 0,9 s
};
export const pickupX = (ts: number) => 44 - 14.2 * ts;

export const Carrefour: React.FC<{ts: number}> = ({ts}) => {
  const asphalte = useMat('#2a2c32'), ligne = useMat('#e8d890'), blanc = useMat('#e8e8e2'), metal = useMat('#3a3d44'), trottoir = useMat('#55575c'), herbe = useMat('#1e2a24');
  const lampe = useMemo(() => new THREE.MeshStandardMaterial({color: '#fff', emissive: new THREE.Color('#ffc870'), emissiveIntensity: 2.5}), []);
  const rouge = useMemo(() => new THREE.MeshStandardMaterial({color: '#300', emissive: new THREE.Color('#ff2a2a'), emissiveIntensity: 3}), []);
  const vert = useMemo(() => new THREE.MeshStandardMaterial({color: '#030', emissive: new THREE.Color('#3dff7a'), emissiveIntensity: 3}), []);
  const eteint = useMat('#1a1c20');
  const freinage = ts > 2.73 && ts < 3.63;
  return (
    <group>
      <Ambiance nuit brume={[22, 85]} />
      <hemisphereLight args={['#5a6aaa', '#202030', 0.35]} />
      <Etoiles />
      <mesh material={herbe} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[240, 240]} /></mesh>
      <mesh material={asphalte} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><planeGeometry args={[9, 240]} /></mesh>
      <mesh material={asphalte} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]} receiveShadow><planeGeometry args={[240, 9]} /></mesh>
      {Array.from({length: 40}, (_, i) => {
        const v = -118 + i * 6;
        if (Math.abs(v) < 6) return null;
        return (
          <group key={i}>
            <mesh material={ligne} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, v]}><planeGeometry args={[0.15, 2.6]} /></mesh>
            <mesh material={ligne} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[v, 0.02, 0]}><planeGeometry args={[0.15, 2.6]} /></mesh>
          </group>
        );
      })}
      {Array.from({length: 9}, (_, i) => <mesh key={i} material={blanc} rotation={[-Math.PI / 2, 0, 0]} position={[-4 + i, 0.021, -6]}><planeGeometry args={[0.55, 2]} /></mesh>)}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} material={trottoir} position={[sx * 20, 0.08, sz * 20]}><boxGeometry args={[31, 0.16, 31]} /></mesh>
      ))}
      {/* feux : vert pour Ethan (axe z), rouge pour le pick-up (axe x) */}
      {[[5.2, -5.2, 0], [-5.2, 5.2, Math.PI]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0.16, z]} rotation={[0, r, 0]}>
          <mesh material={metal} position={[0, 2, 0]}><cylinderGeometry args={[0.08, 0.08, 4, 6]} /></mesh>
          <mesh material={metal} position={[0, 4.2, 0]}><boxGeometry args={[0.45, 1.2, 0.4]} /></mesh>
          {[0.38, 0, -0.38].map((y, k) => <mesh key={k} material={k === 2 ? vert : eteint} position={[0, 4.2 + y, -0.21]} rotation={[0, Math.PI, 0]}><circleGeometry args={[0.13, 12]} /></mesh>)}
          {/* face latérale vue par le pick-up : rouge allumé */}
          {[0.38, 0, -0.38].map((y, k) => <mesh key={`l${k}`} material={k === 0 ? rouge : eteint} position={[0.23, 4.2 + y, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.13, 12]} /></mesh>)}
        </group>
      ))}
      {[[-6, -14], [6, -30], [-6, -46], [6, 14], [14, 6], [30, -6], [-14, 6]].map(([x, z], i) => (
        <group key={i} position={[x, 0.16, z]}>
          <mesh material={metal} position={[0, 3, 0]}><cylinderGeometry args={[0.08, 0.1, 6, 6]} /></mesh>
          <mesh material={lampe} position={[0, 6.05, 0]}><boxGeometry args={[0.6, 0.12, 0.6]} /></mesh>
          <pointLight position={[0, 5.6, 0]} intensity={34} distance={16} color="#ffc870" />
        </group>
      ))}
      <Voiture p={[-1.9, 0, voitureZ(ts)]} couleur="#2e86de" phares={1}>
        <Perso p={[-0.42, 0.45, -0.1]} pose="volant" humeur={ts > 2.4 ? 'triste' : 'content'} teteY={ts > 2.2 ? -0.9 : 0} echelle={0.92} />
        <Perso p={[0.42, 0.45, -0.1]} pose="assis" humeur={ts > 2.4 ? 'triste' : 'content'} echelle={0.92} haut="#e84a5f" peau="#e9b27d" cheveux="#c8902a" capuche={false} teteY={ts > 2.2 ? -1.0 : -0.4} />
        <Perso p={[0, 0.45, -1.1]} pose="assis" humeur="content" echelle={0.92} haut="#47c46a" peau="#8a5a3b" cheveux="#1a1410" capuche={false} />
      </Voiture>
      {freinage && <pointLight position={[-1.9, 0.8, voitureZ(ts) - 2.6]} intensity={20} distance={6} color="#ff2a2a" />}
      <Pickup p={[pickupX(ts), 0, 2.1]} rotY={-Math.PI / 2} />
    </group>
  );
};

/* ================================================================== caméra & aiguillage */

export type Decor = 'chambre' | 'chambreNuit' | 'rue' | 'examen' | 'burger' | 'nuit' | 'carrefour';
/** `ref` : image de départ des animations du décor (pour enchaîner plusieurs angles sans remettre l'action à zéro). */
export type Plan = {decor: Decor; de: number; a: number; ref?: number; cam: (t: number, f: number) => {pos: V3; cible: V3; fov?: number}};

const Camera: React.FC<{pos: V3; cible: V3; fov?: number}> = ({pos, cible, fov = 40}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.lookAt(...cible);
  if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
  return null;
};

export type EtatEthan = {chambreHumeur: Humeur; rueHumeur: Humeur; refusBurger: number; tsCarrefour: number};

/** Position d'Ethan dans la rue (partagée avec la caméra qui le suit). */
export const ethanRueX = (f: number, plan: Plan) => -3 + (f - (plan.ref ?? plan.de)) * 0.045;

export const Monde: React.FC<{f: number; plans: Plan[]; etat: EtatEthan}> = ({f, plans, etat}) => {
  const plan = plans.find((p) => f >= p.de && f < p.a) ?? plans[plans.length - 1];
  // la caméra et les animations lisent la même image ; la caméra peut aussi lire l'état (temps du carrefour)
  const t = (f - plan.de) / Math.max(1, plan.a - plan.de);
  const cam = plan.cam(t, f);
  return (
    <>
      <Camera {...cam} />
      {(plan.decor === 'chambre' || plan.decor === 'chambreNuit') && (
        <>
          <Chambre nuit={plan.decor === 'chambreNuit'} />
          <Perso p={[-1.2, 0.63, -0.45]} rotY={0.35} pose="assis" humeur={etat.chambreHumeur} teteX={plan.decor === 'chambreNuit' ? 0.12 : -0.05} />
        </>
      )}
      {plan.decor === 'rue' && (
        <>
          <Rue f={f} debut={plan.ref ?? plan.de} />
          <Perso p={[ethanRueX(f, plan), 0.14, 0.8]} rotY={Math.PI / 2} pose="marche" humeur={etat.rueHumeur} />
        </>
      )}
      {plan.decor === 'examen' && <Examen f={f} debut={plan.ref ?? plan.de} />}
      {plan.decor === 'burger' && <Burger f={f} debut={plan.ref ?? plan.de} refus={etat.refusBurger} />}
      {plan.decor === 'nuit' && <RouteNuit f={f} debut={plan.ref ?? plan.de} />}
      {plan.decor === 'carrefour' && <Carrefour ts={etat.tsCarrefour} />}
    </>
  );
};
