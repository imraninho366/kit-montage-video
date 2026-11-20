import {useMemo} from 'react';
import * as THREE from 'three';

/** Matériau plat façon jouet : facettes visibles, comme les villes low-poly de référence. */
export const plat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({color, flatShading: true, roughness: 0.85, metalness: 0, ...extra});

export const useMat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => plat(color, extra), [color]);

/** Étiquette pseudo (pastille blanche, texte sombre) dessinée sur un canvas puis posée en sprite. */
const textureEtiquette = (texte: string, fond: string, encre: string, taille: number) => {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const police = `900 ${taille}px Montserrat, Arial, sans-serif`;
  ctx.font = police;
  const w = Math.ceil(ctx.measureText(texte).width + taille * 1.1);
  const h = Math.ceil(taille * 1.7);
  c.width = w; c.height = h;
  ctx.font = police;
  ctx.fillStyle = fond;
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, h - 4, h / 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = encre;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texte, w / 2, h / 2 + taille * 0.05);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return {t, ratio: w / h};
};

export const Etiquette: React.FC<{texte: string; position: [number, number, number]; hauteur?: number; echelle?: number; fond?: string; encre?: string}> = ({
  texte, position, hauteur = 0.42, echelle = 1, fond = '#ffffff', encre = '#1b1d24',
}) => {
  const {t, ratio} = useMemo(() => textureEtiquette(texte, fond, encre, 64), [texte, fond, encre]);
  if (echelle <= 0.001) return null;
  return (
    <sprite position={position} scale={[hauteur * ratio * echelle, hauteur * echelle, 1]} renderOrder={10}>
      <spriteMaterial map={t} depthTest={false} transparent />
    </sprite>
  );
};

/** Lettre de vote : rond jaune cerclé de sombre, lettre sombre au centre. */
const textureLettre = (lettre: string) => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#2b1a00';
  ctx.beginPath(); ctx.arc(128, 128, 122, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffc928';
  ctx.beginPath(); ctx.arc(128, 128, 106, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b1a00';
  ctx.font = '900 150px "Lilita One", Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(lettre, 128, 140);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const Lettre: React.FC<{lettre: string; position: [number, number, number]; taille?: number; echelle?: number}> = ({lettre, position, taille = 0.75, echelle = 1}) => {
  const t = useMemo(() => textureLettre(lettre), [lettre]);
  if (echelle <= 0.001) return null;
  return (
    <sprite position={position} scale={[taille * echelle, taille * echelle, 1]} renderOrder={11}>
      <spriteMaterial map={t} depthTest={false} transparent />
    </sprite>
  );
};

/** Volume « à venir » : bloc sombre bordé de pointillés blancs, comme les bâtiments mystère de référence. */
export const VolumeMystere: React.FC<{geometrie: THREE.BufferGeometry; position: [number, number, number]; echelle?: number; rotation?: [number, number, number]}> = ({
  geometrie, position, echelle = 1, rotation = [0, 0, 0],
}) => {
  const {plein, bords} = useMemo(() => {
    const plein = new THREE.Mesh(geometrie, new THREE.MeshBasicMaterial({color: '#151a2b', side: THREE.DoubleSide, fog: false}));
    const bords = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometrie, 30),
      new THREE.LineDashedMaterial({color: '#ffffff', dashSize: 0.18, gapSize: 0.12, linewidth: 2, fog: false}),
    );
    bords.computeLineDistances();
    return {plein, bords};
  }, [geometrie]);
  if (echelle <= 0.001) return null;
  return (
    <group position={position} scale={echelle} rotation={rotation}>
      <primitive object={plein} />
      <primitive object={bords} />
    </group>
  );
};

/** Petit générateur pseudo-aléatoire stable (mêmes positions à chaque image). */
export const hasard = (graine: number) => {
  const x = Math.sin(graine * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
