import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {feature} from 'topojson-client';
import etatsAlbers from 'us-atlas/states-albers-10m.json';

/**
 * Carte des États-Unis en relief : la hauteur de chaque État = son loyer médian.
 * Le plafond de verre = le montant de la pension. Ce qui le traverse dépasse le chèque entier.
 */
const ECHELLE = 0.01;
const HAUTEUR_PLAFOND = 0.95;
const DISTANCE_MINI = 0.04; // simplifie les côtes : à pleine résolution, elles font des rideaux striés

type Etat = {id: string; properties: {name: string}; geometry: {type: string; coordinates: number[][][] | number[][][][]}};
const collection = feature(etatsAlbers as never, (etatsAlbers as never as {objects: {states: never}}).objects.states) as unknown as {features: Etat[]};

const simplifier = (points: number[][]) => {
  const garde: [number, number][] = [];
  points.forEach(([x, y]) => {
    const X = (x - 487.5) * ECHELLE, Y = -(y - 305) * ECHELLE;
    const d = garde[garde.length - 1];
    if (!d || Math.hypot(X - d[0], Y - d[1]) >= DISTANCE_MINI) garde.push([X, Y]);
  });
  return garde;
};

const anneau = (points: [number, number][], forme: THREE.Shape | THREE.Path) => {
  points.forEach(([X, Y], i) => {
    if (i === 0) forme.moveTo(X, Y);
    else forme.lineTo(X, Y);
  });
  return forme;
};

const geometrie = (e: Etat) => {
  const polys = (e.geometry.type === 'Polygon' ? [e.geometry.coordinates] : e.geometry.coordinates) as number[][][][];
  const contours: THREE.Vector3[] = [];
  const formes: THREE.Shape[] = [];
  polys.forEach((p) => {
    const ext = simplifier(p[0]);
    if (ext.length < 3) return; // îlots trop petits pour se voir
    const f = anneau(ext, new THREE.Shape()) as THREE.Shape;
    p.slice(1).map(simplifier).filter((r) => r.length >= 3).forEach((trou) => f.holes.push(anneau(trou, new THREE.Path()) as THREE.Path));
    formes.push(f);
    ext.forEach(([x, y], i) => {
      const [u, v] = ext[(i + 1) % ext.length];
      contours.push(new THREE.Vector3(x, y, 1), new THREE.Vector3(u, v, 1));
    });
  });
  // three 0.175 : ExtrudeGeometry sans biseau ne produit aucune face du dessus, on la pose à part
  const dessus = new THREE.ShapeGeometry(formes).translate(0, 0, 1);
  return {geo: new THREE.ExtrudeGeometry(formes, {depth: 1, bevelEnabled: false}), dessus, contour: new THREE.BufferGeometry().setFromPoints(contours)};
};

const GEOMETRIES = collection.features.map((e) => ({nom: e.properties.name, ...geometrie(e)}));

export type CleCamera = {a: number; pos: [number, number, number]; vise: [number, number, number]};

const Camera: React.FC<{cles: CleCamera[]}> = ({cles}) => {
  const f = useCurrentFrame();
  const {camera} = useThree();
  const {pos, vise} = useMemo(() => ({
    pos: new THREE.CatmullRomCurve3(cles.map((c) => new THREE.Vector3(...c.pos)), false, 'centripetal'),
    vise: new THREE.CatmullRomCurve3(cles.map((c) => new THREE.Vector3(...c.vise)), false, 'centripetal'),
  }), [cles]);
  const dernier = cles.length - 1;
  // chaque tronçon a son propre temps : la caméra ralentit et repart comme à la main
  const t = interpolate(f, cles.map((c) => c.a), cles.map((_, i) => i / dernier), {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin),
  });
  camera.position.copy(pos.getPoint(t));
  camera.lookAt(vise.getPoint(t));
  return null;
};

export const CarteLoyers3D: React.FC<{
  loyers: Record<string, number>; paliers: Record<string, number>; pension: number; couleurs: string[]; debuts: number[]; cles: CleCamera[]; plafondDe: number; attenueDe: number;
}> = ({loyers, paliers, pension, couleurs, debuts, cles, plafondDe, attenueDe}) => {
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const rangs = useMemo(() => {
    const r: Record<string, number> = {};
    [0, 1, 2, 3].forEach((p) => Object.keys(paliers).filter((k) => paliers[k] === p).sort((a, b) => loyers[a] - loyers[b]).forEach((k, i) => { r[k] = i; }));
    return r;
  }, [loyers, paliers]);
  const verre = interpolate(f, [plafondDe, plafondDe + 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lumiere = interpolate(f, [attenueDe, attenueDe + 30], [1, 0.32], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const contour = useMemo(() => new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-5.3, 0, -3.5), new THREE.Vector3(5.3, 0, -3.5), new THREE.Vector3(5.3, 0, 3.5), new THREE.Vector3(-5.3, 0, 3.5),
  ]), []);
  return (
    <ThreeCanvas width={width} height={height} camera={{fov: 38, near: 0.1, far: 80, position: [0, 9, 3]}} shadows
      style={{position: 'absolute', inset: 0}}>
      <color attach="background" args={['#07090c']} />
      <fog attach="fog" args={['#07090c', 15, 34]} />
      <Camera cles={cles} />
      <ambientLight intensity={0.5 * lumiere} />
      <hemisphereLight args={['#9fb8d8', '#1a120a', 0.7 * lumiere]} />
      <directionalLight position={[5, 9, 4]} intensity={2.4 * lumiere} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0d1014" roughness={0.55} metalness={0.2} />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {GEOMETRIES.map(({nom, geo, dessus, contour: bords}) => {
          const p = paliers[nom];
          if (p === undefined) return null;
          const debut = debuts[p] + rangs[nom] * (p === 3 ? 0 : 3);
          const monte = spring({frame: f - debut, fps, config: p === 3 ? {damping: 16, stiffness: 42, mass: 1.4} : {damping: 13, stiffness: 90}});
          const h = Math.max(0.015, (loyers[nom] / pension) * HAUTEUR_PLAFOND * monte);
          const estCA = nom === 'California';
          const pouls = estCA && f > debut + 20 ? 0.55 + Math.sin(f * 0.2) * 0.3 : 0;
          return (
            <group key={nom} scale={[1, 1, h]}>
              <mesh geometry={geo} castShadow receiveShadow>
                <meshStandardMaterial color={monte > 0.02 ? couleurs[p] : '#232830'} roughness={0.42} metalness={0.12} side={THREE.DoubleSide}
                  emissive={estCA ? couleurs[3] : '#000000'} emissiveIntensity={pouls * lumiere} />
              </mesh>
              <mesh geometry={dessus} castShadow receiveShadow>
                <meshStandardMaterial color={monte > 0.02 ? couleurs[p] : '#566170'} roughness={0.42} metalness={0.12} side={THREE.DoubleSide}
                  emissive={estCA ? couleurs[3] : '#000000'} emissiveIntensity={pouls * lumiere} />
              </mesh>
              <lineSegments geometry={bords}>
                <lineBasicMaterial color="#090b0e" />
              </lineSegments>
            </group>
          );
        })}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, HAUTEUR_PLAFOND, 0]}>
        <planeGeometry args={[10.6, 7]} />
        <meshStandardMaterial color="#cfe6ff" transparent opacity={0.13 * verre} side={THREE.DoubleSide} depthWrite={false} roughness={0.1} metalness={0.3} />
      </mesh>
      <lineLoop position={[0, HAUTEUR_PLAFOND, 0]} geometry={contour}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.8 * verre} />
      </lineLoop>
    </ThreeCanvas>
  );
};
