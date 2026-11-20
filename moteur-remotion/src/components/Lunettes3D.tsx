import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {theme} from '../design/theme';
import {Odometre} from './Odometre';

/** Rectangle aux coins arrondis, centré, pour les cercles de monture et les verres. */
const rectArrondi = <T extends THREE.Path>(w: number, h: number, r: number, forme: T): T => {
  const x = -w / 2, y = -h / 2;
  forme.moveTo(x + r, y);
  forme.lineTo(x + w - r, y); forme.quadraticCurveTo(x + w, y, x + w, y + r);
  forme.lineTo(x + w, y + h - r); forme.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  forme.lineTo(x + r, y + h); forme.quadraticCurveTo(x, y + h, x, y + h - r);
  forme.lineTo(x, y + r); forme.quadraticCurveTo(x, y, x + r, y);
  return forme;
};

const BISEAU = {bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 5, curveSegments: 40};
const CX = 1.36;   // centre de chaque cercle

/** Environnement studio : c'est lui qui donne les reflets sur l'acétate et les verres. */
const Studio: React.FC = () => {
  const {gl, scene} = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  return null;
};

const Modele: React.FC<{eclatement: number; rotation: number}> = ({eclatement, rotation}) => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const cercle = rectArrondi(2.34, 1.78, 0.78, new THREE.Shape());
    cercle.holes.push(rectArrondi(1.98, 1.42, 0.62, new THREE.Path()));
    const monture = new THREE.ExtrudeGeometry(cercle, {depth: 0.2, ...BISEAU});
    monture.translate(0, 0, -0.1);
    const verre = new THREE.ExtrudeGeometry(rectArrondi(2.0, 1.44, 0.63, new THREE.Shape()), {depth: 0.04, ...BISEAU, bevelThickness: 0.02, bevelSize: 0.01});
    verre.translate(0, 0, -0.02);
    const pont = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.2, 0.38, 0), new THREE.Vector3(0, 0.62, 0.05), new THREE.Vector3(0.2, 0.38, 0)), 24, 0.085, 12);
    // branche vue de profil : longue, qui plonge en bout (le crochet derrière l'oreille)
    const profil = new THREE.Shape();
    profil.moveTo(0, 0.09); profil.lineTo(3.2, 0.04); profil.quadraticCurveTo(3.9, 0.0, 4.25, -0.62);
    profil.lineTo(4.12, -0.66); profil.quadraticCurveTo(3.8, -0.1, 3.2, -0.05); profil.lineTo(0, -0.09); profil.closePath();
    const branche = new THREE.ExtrudeGeometry(profil, {depth: 0.09, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 24});
    branche.rotateY(Math.PI / 2);
    return {monture, verre, pont, branche};
  }, []);
  const acetate = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#040405', roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.7}), []);
  const verreMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#dfe9f2', roughness: 0.02, metalness: 0,
    transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 3.2, specularIntensity: 1, depthWrite: false}), []);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({color: '#c9a86a', metalness: 1, roughness: 0.25}), []);
  const e = eclatement;
  const flotte = Math.sin(frame / 22) * 0.05;
  return (
    <group rotation={[0.12 + Math.sin(frame / 40) * 0.02, rotation, 0]} position={[0, 0.35 + flotte, 0]}>
      <group position={[0, 0, -0.6 * e]}>
        {[-1, 1].map((c) => <mesh key={c} geometry={geo.monture} material={acetate} position={[c * CX, 0, 0]} />)}
        <mesh geometry={geo.pont} material={acetate} />
        {[-1, 1].map((c) => (
          <group key={c} position={[c * 2.52, 0.42, 0]}>
            <mesh material={acetate} position={[0, 0, -0.05]}><boxGeometry args={[0.26, 0.3, 0.3]} /></mesh>
            <mesh material={metal} position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.05, 0.05, 0.12, 16]} /></mesh>
            <mesh geometry={geo.branche} material={acetate} position={[c > 0 ? 0.04 : -0.13, 0, -0.2]} />
          </group>
        ))}
      </group>
      {[-1, 1].map((c) => (
        <mesh key={c} geometry={geo.verre} material={verreMat}
          position={[c * (CX + 0.55 * e), 0.1 * e, 1.9 * e]} rotation={[0, c * 0.35 * e, c * 0.08 * e]} />
      ))}
    </group>
  );
};

/**
 * Une paire de lunettes en vraie 3D (Three.js) qui tourne, puis se démonte : les verres sortent
 * vers la caméra, la monture recule. Étiquettes de prix en HTML par-dessus.
 */
export const Lunettes3D: React.FC<{
  eclate: number; rassemble: number; monture: {texte: string; sous: string}; verres: {texte: string; sous: string; a: number};
  total: {texte: string; sous: string; a: number}; source: string;
}> = ({eclate, rassemble, monture, verres, total, source}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const ouvre = spring({frame: frame - eclate, fps, config: {damping: 16, stiffness: 70, mass: 1.2}});
  const ferme = spring({frame: frame - rassemble, fps, config: {damping: 18, stiffness: 80}});
  const eclatement = ouvre * (1 - ferme);
  const rotation = interpolate(frame, [0, 200], [-0.75, 0.28], {extrapolateRight: 'clamp'}) + Math.sin(frame / 50) * 0.04;
  const zoom = interpolate(frame, [0, 200], [10.5, 9.2], {extrapolateRight: 'clamp'});
  const etiquette = (a: number, fin: number) => spring({frame: frame - a, fps, config: {damping: 200}}) * (1 - spring({frame: frame - fin, fps, config: {damping: 200}}));
  const eM = etiquette(4, rassemble), eV = etiquette(verres.a, rassemble), eT = spring({frame: frame - total.a, fps, config: {damping: 200}});
  const tag = (o: number, c: {texte: string; sous: string}, pos: React.CSSProperties, droite = false) => (
    <div style={{position: 'absolute', ...pos, opacity: o, transform: `translateY(${(1 - o) * 16}px)`, textAlign: droite ? 'right' : 'left'}}>
      <div style={{fontFamily: theme.type.titre, fontSize: 84, color: 'var(--encre, #F2F0EB)', lineHeight: 1}}>{c.texte}</div>
      <div style={{fontFamily: theme.type.corps, fontSize: 28, color: 'var(--sourdine, #8A94A0)', marginTop: 6}}>{c.sous}</div>
      <div style={{height: 3, width: 120 * o, backgroundColor: 'var(--accent, #D9A441)', marginTop: 14, marginLeft: droite ? 'auto' : 0}} />
    </div>
  );
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #232830 0%, #0b0d11 70%)'}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0.5, zoom], fov: 30}} gl={{antialias: true}}>
        <Studio />
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} />
        <directionalLight position={[-6, 2, -4]} intensity={1.4} color="#ffb163" />
        <pointLight position={[0, -3, 3]} intensity={6} color="#7fa8d8" />
        <Modele eclatement={eclatement} rotation={rotation} />
      </ThreeCanvas>
      {tag(eM, monture, {left: theme.marge * 1.4, top: 760})}
      {tag(eV, verres, {right: theme.marge * 1.4, top: 760}, true)}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 95, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: eT}}>
        {frame >= total.a ? <Odometre texte={total.texte} style={{fontFamily: theme.type.titre, fontSize: 150, color: 'var(--accent, #D9A441)'}} /> : null}
        <div style={{fontFamily: theme.type.corps, fontSize: 32, color: 'var(--encre, #F2F0EB)', marginTop: 8}}>{total.sous}</div>
      </div>
      
    </AbsoluteFill>
  );
};
