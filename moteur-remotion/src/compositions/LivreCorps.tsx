import {useThree} from '@react-three/fiber';
import {loadFont} from '@remotion/google-fonts/PlayfairDisplay';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';
import * as THREE from 'three';

/** Prototype muet « le livre du corps » : pourquoi on sursaute en s'endormant. */
export const DUREE_LIVRE_CORPS = 1500;

const {fontFamily, waitUntilDone} = loadFont('normal', {weights: ['500', '800'], subsets: ['latin', 'latin-ext']});

export const ENCRE = '#2a211a';
export const ROUGE = '#b5321f';
export const PAPIER = '#f1e6d0';
export const LARGEUR_PAGE = 3.5;
export const HAUTEUR_PAGE = 2.75;
export const EPAISSEUR = 0.14;

// --- Les pages : un canevas par texte, posé à plat sur la page du bas ---
type Ligne = {t: string; taille: number; gras?: boolean; rouge?: boolean};
const CW = 1024, CH = 800;

const texteSurCanevas = (lignes: Ligne[], depart = 40) => {
  const c = document.createElement('canvas');
  c.width = CW; c.height = CH;
  const x = c.getContext('2d')!;
  x.textAlign = 'center';
  x.textBaseline = 'top';
  let y = depart;
  for (const l of lignes) {
    x.font = `${l.gras ? 800 : 500} ${l.taille}px "${fontFamily}"`;
    x.fillStyle = l.rouge ? ROUGE : ENCRE;
    const mots = l.t.split(' ');
    let courant = '';
    const sorties: string[] = [];
    for (const m of mots) {
      const essai = courant ? `${courant} ${m}` : m;
      if (x.measureText(essai).width > CW - 90 && courant) { sorties.push(courant); courant = m; } else courant = essai;
    }
    sorties.push(courant);
    for (const s of sorties) { x.fillText(s, CW / 2, y); y += l.taille * 1.17; }
    y += l.taille * 0.28;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

const BEATS: {de: number; a: number; lignes: Ligne[]; depart?: number}[] = [
  {de: 0, a: 132, lignes: [{t: 'Tu t’endors…', taille: 104}, {t: 'et ton corps sursaute.', taille: 112, gras: true, rouge: true}], depart: 150},
  {de: 135, a: 398, lignes: [{t: 'Pourquoi ?', taille: 92, gras: true}, {t: 'A. Ton cœur s’arrête', taille: 68}, {t: 'B. Un faux signal du cerveau', taille: 68}], depart: 10},
  {de: 432, a: 535, lignes: [{t: 'Réponse B.', taille: 120, gras: true, rouge: true}, {t: 'Un faux signal.', taille: 84, gras: true}, {t: 'Ton cœur continue de battre.', taille: 66}], depart: 170},
  {de: 540, a: 748, lignes: [{t: 'En t’endormant,', taille: 92}, {t: 'tes muscles se relâchent.', taille: 104, gras: true}], depart: 170},
  {de: 750, a: 958, lignes: [{t: 'Parfois, le bas du cerveau', taille: 76}, {t: 'lance une décharge.', taille: 112, gras: true, rouge: true}], depart: 170},
  {de: 960, a: 1168, lignes: [{t: 'Une piste, pas une preuve :', taille: 70}, {t: 'il croit que tu tombes.', taille: 112, gras: true}], depart: 170},
  {de: 1170, a: 1288, lignes: [{t: 'C’est en général sans danger.', taille: 92, gras: true}, {t: 'Le café, le stress et le manque de sommeil peuvent en donner plus.', taille: 62}], depart: 110},
  {de: 1290, a: 1383, lignes: [{t: 'Et toi,', taille: 96}, {t: 'ça t’arrive souvent ?', taille: 112, gras: true, rouge: true}, {t: 'Dis-le en commentaire.', taille: 72}], depart: 110},
  {de: 1385, a: 1600, lignes: [{t: 'Abonne-toi', taille: 136, gras: true, rouge: true}, {t: 'pour tourner la prochaine page.', taille: 70}], depart: 190},
];

/** Un texte qui s'imprime sur la page : montée d'opacité, puis disparition. */
const Texte: React.FC<{tex: THREE.Texture; de: number; a: number}> = ({tex, de, a}) => {
  const f = useCurrentFrame();
  if (f < de || f > a) return null;
  const o = interpolate(f, [de, de + 8, a - 5, a], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, EPAISSEUR + 0.012, 0.12 + 1.27]} renderOrder={3}>
      <planeGeometry args={[3.3, 3.3 * CH / CW]} />
      <meshBasicMaterial map={tex} transparent opacity={o} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// --- Le décor ---
export const textureBois = () => {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const x = c.getContext('2d')!;
  x.fillStyle = '#3c2416';
  x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 520; i++) {
    const y0 = (i * 397.3) % 1024;
    x.strokeStyle = `rgba(${i % 2 ? '20,10,5' : '110,70,40'},${0.05 + ((i * 13) % 10) / 90})`;
    x.lineWidth = 1 + (i % 4);
    x.beginPath();
    x.moveTo(0, y0);
    x.bezierCurveTo(340, y0 + Math.sin(i) * 16, 680, y0 - Math.cos(i * 2) * 16, 1024, y0 + Math.sin(i * 3) * 8);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
};

/** Trame de hachures : c'est elle qui donne le côté gravure aux pièces découpées. */
export const textureHachures = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#fff';
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(70,50,35,0.28)';
  x.lineWidth = 1.5;
  for (let i = -256; i < 512; i += 11) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 256, 256); x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1.6, 1.6);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const Livre: React.FC = () => (
  <group>
    <mesh position={[0, EPAISSEUR / 2 - 0.02, 0]} castShadow receiveShadow>
      <boxGeometry args={[LARGEUR_PAGE + 0.16, EPAISSEUR, HAUTEUR_PAGE * 2 + 0.16]} />
      <meshStandardMaterial color="#5a1f18" roughness={0.75} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[0, EPAISSEUR + 0.002, s * HAUTEUR_PAGE / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[LARGEUR_PAGE, HAUTEUR_PAGE - 0.02]} />
        <meshStandardMaterial color={PAPIER} roughness={0.95} />
      </mesh>
    ))}
    <mesh position={[0, EPAISSEUR + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[LARGEUR_PAGE, 0.05]} />
      <meshBasicMaterial color="#8a7458" transparent opacity={0.55} />
    </mesh>
  </group>
);

// --- Les pièces découpées du pop-up ---
export const capsule = (ax: number, ay: number, bx: number, by: number, r: number) => {
  const ang = Math.atan2(by - ay, bx - ax);
  const s = new THREE.Shape();
  s.absarc(ax, ay, r, ang + Math.PI / 2, ang + Math.PI * 1.5, false);
  s.absarc(bx, by, r, ang - Math.PI / 2, ang + Math.PI / 2, false);
  s.closePath();
  return s;
};

export const Piece: React.FC<{forme: THREE.Shape; couleur: string | THREE.Color; carte: THREE.Texture; z?: number; prof?: number; opacite?: number}> = ({forme, couleur, carte, z = 0, prof = 0.035, opacite = 1}) => {
  const {geo, bords} = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(forme, {depth: prof, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 24});
    return {geo: g, bords: new THREE.EdgesGeometry(g, 35)};
  }, [forme, prof]);
  return (
    <group position={[0, 0, z]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={couleur} map={carte} roughness={0.92} transparent={opacite < 1} opacity={opacite} />
      </mesh>
      <lineSegments geometry={bords}>
        <lineBasicMaterial color={ENCRE} transparent={opacite < 1} opacity={opacite} />
      </lineSegments>
    </group>
  );
};

export const halo = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,245,210,1)');
  g.addColorStop(0.25, 'rgba(255,120,60,0.8)');
  g.addColorStop(1, 'rgba(255,60,20,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

const SURSAUTS = [24, 92, 856, 905];
const secousse = (f: number) => SURSAUTS.reduce((m, e) => (f >= e ? Math.max(m, Math.exp(-(f - e) / 7)) : m), 0);

const HANCHE: [number, number] = [0.32, 0.86];
const COURBE_DOS = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.17, 0.9, 0.08), new THREE.Vector3(-0.98, 0.8, 0.08), new THREE.Vector3(-0.4, 0.8, 0.08), new THREE.Vector3(HANCHE[0], HANCHE[1], 0.08),
]);
const COURBE_JAMBE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0.08), new THREE.Vector3(0.65, -0.01, 0.08), new THREE.Vector3(1.3, 0, 0.08),
]);

const Scene: React.FC<{carte: THREE.Texture}> = ({carte}) => {
  const f = useCurrentFrame();
  const formes = useMemo(() => {
    const matelas = new THREE.Shape();
    matelas.moveTo(-1.7, 0.42); matelas.lineTo(1.7, 0.42); matelas.lineTo(1.7, 0.66); matelas.lineTo(-1.7, 0.66); matelas.closePath();
    const cadre = new THREE.Shape();
    cadre.moveTo(-1.72, 0); cadre.lineTo(-1.6, 0); cadre.lineTo(-1.6, 0.26); cadre.lineTo(1.6, 0.26); cadre.lineTo(1.6, 0); cadre.lineTo(1.72, 0);
    cadre.lineTo(1.72, 0.44); cadre.lineTo(-1.72, 0.44); cadre.closePath();
    const tete = new THREE.Shape();
    tete.absarc(-1.28, 1.03, 0.33, 0, Math.PI * 2, false);
    const cerveau = new THREE.Shape();
    cerveau.moveTo(-1.5, 1.05);
    cerveau.bezierCurveTo(-1.55, 1.34, -1.05, 1.34, -1.04, 1.07);
    cerveau.bezierCurveTo(-1.05, 0.93, -1.42, 0.9, -1.5, 1.05);
    return {
      matelas, cadre, tete, cerveau,
      oreiller: capsule(-1.5, 0.74, -0.95, 0.74, 0.09),
      tronc: capsule(-0.85, 0.87, HANCHE[0], HANCHE[1], 0.2),
      jambe: capsule(0, 0, 1.3, 0, 0.115),
      bras: capsule(0, 0, 0.9, -0.03, 0.08),
      tige: capsule(-1.2, 0.97, -1.16, 0.88, 0.035),
    };
  }, []);
  const haloTex = useMemo(() => halo(), []);

  const j = secousse(f);
  const pop = interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5))});
  // Rouge = muscles tendus, puis le corps pâlit pendant qu'il s'endort.
  const relache = interpolate(f, [560, 700], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const decharge = interpolate(f, [790, 856], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flash = decharge > 0 && decharge < 1 ? 1 : Math.max(0, j);
  const corps = new THREE.Color('#dd9a78').lerp(new THREE.Color('#d9dfdf'), relache).lerp(new THREE.Color('#ee7a55'), f > 770 && f < 960 ? flash * 0.75 : 0);
  const chute = interpolate(f, [965, 985, 1150, 1168], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flottement = chute * Math.sin(f / 9) * 0.03 + chute * 0.1;
  // Le gros plan se fait sur la découpe et non à la caméra : le texte reste lisible en dessous.
  const zoom = interpolate(f, [540, 575, 925, 960], [1, 1.2, 1.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const dec = interpolate(f, [540, 575, 790, 856, 925, 960], [0, 0.35, 0.35, -0.03, -0.03, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});

  const dansDos = decharge > 0 && decharge < 0.62;
  const dansJambe = decharge >= 0.62 && decharge < 1;
  const pDos = COURBE_DOS.getPoint(Math.min(1, decharge / 0.62));
  const pJambe = COURBE_JAMBE.getPoint(Math.min(1, Math.max(0, (decharge - 0.62) / 0.38)));
  const taille = 0.34 + Math.sin(f * 0.9) * 0.05;

  return (
    <group position={[0, EPAISSEUR, -0.8]} rotation={[-0.8 * pop - (1 - pop) * 1.55, 0, 0]} scale={[zoom, zoom * 1.35, zoom]}>
      <group position={[dec, 0, 0]}>
        <Piece forme={formes.cadre} couleur="#a88a68" carte={carte} />
        <Piece forme={formes.matelas} couleur="#f4efe3" carte={carte} z={0.02} />
        <Piece forme={formes.oreiller} couleur="#fffaf0" carte={carte} z={0.035} />
        <group position={[0, j * 0.16 + flottement + Math.sin(f / 24) * 0.014, 0]}>
          <group rotation={[0, 0, j * 0.05]}>
            <Piece forme={formes.tronc} couleur={corps} carte={carte} z={0.04} />
            <Piece forme={formes.tete} couleur={corps} carte={carte} z={0.05} />
            <Piece forme={formes.cerveau} couleur={relache > 0.02 ? new THREE.Color('#e8a79a').lerp(new THREE.Color('#d8321c'), flash) : '#e8a79a'} carte={carte} z={0.075} prof={0.02} />
            <Piece forme={formes.tige} couleur={f > 770 && f < 960 ? '#d8321c' : '#7c5a44'} carte={carte} z={0.075} prof={0.02} />
            <group position={[-0.72, 0.95, 0.09]} rotation={[0, 0, j * 0.85 + chute * 0.45 * (1 + Math.sin(f / 7) * 0.2)]}>
              <Piece forme={formes.bras} couleur={corps} carte={carte} />
            </group>
            {f >= 770 && f < 925 && (
              <mesh>
                <tubeGeometry args={[COURBE_DOS, 40, 0.012, 8, false]} />
                <meshBasicMaterial color="#c0301c" toneMapped={false} />
              </mesh>
            )}
            {dansDos && (
              <sprite position={pDos} scale={[taille, taille, 1]}>
                <spriteMaterial map={haloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
              </sprite>
            )}
          </group>
          <group position={[HANCHE[0], HANCHE[1] - 0.04, 0.045]} rotation={[0, 0, j * 0.62 + chute * 0.28 * (1 + Math.sin(f / 6) * 0.25)]}>
            <Piece forme={formes.jambe} couleur={corps} carte={carte} />
            {f >= 770 && f < 925 && (
              <mesh>
                <tubeGeometry args={[COURBE_JAMBE, 24, 0.012, 8, false]} />
                <meshBasicMaterial color="#c0301c" toneMapped={false} />
              </mesh>
            )}
            {dansJambe && (
              <sprite position={pJambe} scale={[taille, taille, 1]}>
                <spriteMaterial map={haloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
              </sprite>
            )}
          </group>
        </group>
        {/* Traits de chute : des bandelettes de papier qui remontent derrière le dormeur. */}
        {chute > 0 && [-1.5, -1.05, -0.55, -0.1, 0.4, 0.9, 1.4].map((x, i) => {
          const y = 0.9 + (((f * 0.055 + i * 0.47) % 1.5));
          return (
            <mesh key={x} position={[x, y, -0.03]}>
              <boxGeometry args={[0.022, 0.42, 0.005]} />
              <meshBasicMaterial color={ENCRE} transparent opacity={chute * 0.75} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

/** Le rabat : on répond avant qu'il se lève. */
const Rabat: React.FC<{carte: THREE.Texture; compte: THREE.Texture[]; dessus: THREE.Texture}> = ({carte, compte, dessus}) => {
  const f = useCurrentFrame();
  if (f < 135 || f > 436) return null;
  const arrivee = interpolate(f, [135, 150], [0.8, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const angle = interpolate(f, [388, 420], [0, 2.15], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const sortie = interpolate(f, [412, 432], [1, 0.001], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const n = f >= 240 && f < 390 ? Math.floor((390 - f - 1) / 50) : -1;
  const tic = f >= 240 && f < 390 ? Math.exp(-((390 - f - 1) % 50 === 49 ? 0 : 50 - ((390 - f - 1) % 50)) / 5) * 0.05 : 0;
  return (
    <group position={[0, EPAISSEUR + 0.03 + arrivee + tic, 1.5]} rotation={[-angle, 0, 0]} scale={[sortie, sortie, sortie]}>
      <mesh position={[0, 0, 0.58]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.012, 1.16]} />
        <meshStandardMaterial color="#e4d3b2" map={carte} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.009, 0.58]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.1, 3.1 * CH / CW]} />
        <meshBasicMaterial map={n >= 0 ? compte[n] : dessus} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

const Camera: React.FC = () => {
  const f = useCurrentFrame();
  const {camera} = useThree();
  const j = secousse(f);
  const avance = interpolate(f, [0, DUREE_LIVRE_CORPS], [1.1, 1.05]);
  camera.position.set(Math.sin(f * 2.1) * j * 0.12, 9.6 * avance, 5.45 * avance);
  camera.lookAt(Math.sin(f * 2.7) * j * 0.05, 0.25, 0.2);
  return null;
};

export const LivreCorps: React.FC = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices du livre'));
  useEffect(() => {
    Promise.all([waitUntilDone(), document.fonts.load(`800 80px "${fontFamily}"`, 'é’'), document.fonts.load(`500 80px "${fontFamily}"`, 'é’')])
      .then(() => { setPret(true); continueRender(poignee); })
      .catch((e) => cancelRender(e));
  }, [poignee]);

  const textures = useMemo(() => {
    if (!pret) return null;
    return {
      bois: textureBois(),
      hachures: textureHachures(),
      beats: BEATS.map((b) => texteSurCanevas(b.lignes, b.depart)),
      dessus: texteSurCanevas([{t: 'Réponds avant le rabat', taille: 76, gras: true}], 355),
      compte: [1, 2, 3].map((n) => texteSurCanevas([{t: String(n), taille: 190, gras: true, rouge: true}], 290)),
    };
  }, [pret]);

  return (
    <AbsoluteFill style={{backgroundColor: '#150c07'}}>
      {textures && (
        <ThreeCanvas width={1080} height={1920} shadows camera={{fov: 35, near: 0.1, far: 60}}>
          <Camera />
          <color attach="background" args={['#150c07']} />
          <ambientLight intensity={0.55} color="#ffe6c8" />
          <spotLight position={[-2.6, 9, 3]} angle={0.62} penumbra={0.85} intensity={190} color="#ffd9a8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial map={textures.bois} roughness={0.62} />
          </mesh>
          <Livre />
          <Scene carte={textures.hachures} />
          <Rabat carte={textures.hachures} compte={textures.compte} dessus={textures.dessus} />
          {BEATS.map((b, i) => <Texte key={b.de} tex={textures.beats[i]} de={b.de} a={b.a} />)}
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
