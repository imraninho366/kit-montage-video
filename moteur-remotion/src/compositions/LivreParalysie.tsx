import {useThree} from '@react-three/fiber';
import {loadFont} from '@remotion/google-fonts/PlayfairDisplay';
import {ThreeCanvas} from '@remotion/three';
import {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import minutage from '../videos/livre_paralysie.json';
import {ENCRE, EPAISSEUR, HAUTEUR_PAGE, LARGEUR_PAGE, Livre, PAPIER, Piece, ROUGE, capsule, halo, textureBois, textureHachures} from './LivreCorps';

/** Sous la Peau : la paralysie du sommeil, racontée dans le livre 3D. */
const FPS = 30;
export const DUREE_LIVRE_PARALYSIE = Math.round(61.5 * FPS);

const {fontFamily, waitUntilDone} = loadFont('normal', {weights: ['500', '800'], subsets: ['latin', 'latin-ext']});
const CW = 1024, CH = 800;
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Phrase = (typeof minutage.phrases)[number];
const debutScene = (s: string) => minutage.phrases.find((p) => p.scene === s)!.de;
const finScene = (s: string) => [...minutage.phrases].reverse().find((p) => p.scene === s)!.a;
const T = {
  intrus: debutScene('intrus'), question: debutScene('question'), choixA: debutScene('choixA'), choixB: debutScene('choixB'),
  compte: debutScene('compte'), reponse: debutScene('reponse'), coupure: debutScene('coupure'), blocage: debutScene('blocage'),
  reve: debutScene('reve'), dissout: debutScene('dissout'), chiffres: debutScene('chiffres'), calme: debutScene('calme'),
  fin: debutScene('fin'), abonne: debutScene('abonne'), finAbonne: finScene('abonne'),
};
const ETUDIANTS = minutage.phrases.filter((p) => p.scene === 'chiffres')[1].de;
const motsCompte = minutage.phrases.find((p) => p.scene === 'compte')!.mots;
const momentsCompte = motsCompte.slice(-3).map((m) => m.de);

// --- La page qui s'écrit au rythme de la voix ---
const couper = (x: CanvasRenderingContext2D, mots: string[], largeur: number) => {
  const lignes: number[][] = [[]];
  let courant = '';
  mots.forEach((m, i) => {
    const essai = courant ? `${courant} ${m}` : m;
    if (x.measureText(essai).width > largeur && courant) { lignes.push([i]); courant = m; } else { lignes[lignes.length - 1].push(i); courant = essai; }
  });
  return lignes;
};

/** La ponctuation française isolée reste collée au mot d'avant, sinon elle ouvre une ligne. */
const fusionnerPonctuation = (p: Phrase): Phrase => ({...p, mots: p.mots.reduce<Phrase['mots']>((acc, m) => {
  if (/^[:?!;]$/.test(m.m) && acc.length) acc[acc.length - 1] = {...acc[acc.length - 1], m: `${acc[acc.length - 1].m}\u00a0${m.m}`, a: m.a};
  else acc.push(m);
  return acc;
}, [])});

const ecrirePhrase = (x: CanvasRenderingContext2D, brute: Phrase, t: number) => {
  const p = fusionnerPonctuation(brute);
  const mots = p.mots.map((m) => m.m);
  let taille = 118;
  x.font = `800 ${taille}px "${fontFamily}"`;
  while (couper(x, mots, CW - 100).length > 3 && taille > 74) { taille -= 6; x.font = `800 ${taille}px "${fontFamily}"`; }
  const lignes = couper(x, mots, CW - 100);
  let y = (CH - lignes.length * taille * 1.2) / 2;
  x.textBaseline = 'top';
  x.textAlign = 'left';
  for (const l of lignes) {
    const total = x.measureText(l.map((i) => mots[i]).join(' ')).width;
    let px = (CW - total) / 2;
    for (const i of l) {
      const m = p.mots[i];
      const actif = t >= m.de && t <= m.a + 0.05;
      x.globalAlpha = t < m.de ? 0.22 : 1;
      x.fillStyle = actif ? ROUGE : ENCRE;
      x.fillText(m.m, px, y);
      px += x.measureText(`${m.m} `).width;
    }
    y += taille * 1.2;
  }
  x.globalAlpha = 1;
};

const ecrireQuestion = (x: CanvasRenderingContext2D, t: number) => {
  x.textAlign = 'center';
  x.textBaseline = 'top';
  x.fillStyle = ENCRE;
  x.font = `800 92px "${fontFamily}"`;
  x.fillText('Que se passe-t-il ?', CW / 2, 14);
  x.font = `500 66px "${fontFamily}"`;
  if (t >= T.choixA) x.fillText('A. Un problème au cœur', CW / 2, 134);
  if (t >= T.choixB) x.fillText('B. Ton cerveau, réveillé trop tôt', CW / 2, 222);
};

const texteFixe = (texte: string, taille: number, couleur: string) => {
  const c = document.createElement('canvas');
  c.width = CW; c.height = 400;
  const x = c.getContext('2d')!;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = couleur;
  x.font = `800 ${taille}px "${fontFamily}"`;
  x.fillText(texte, CW / 2, 200);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const Page: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const {c, tex} = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CW; canvas.height = CH;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return {c: canvas, tex: texture};
  }, []);
  useMemo(() => {
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, CW, CH);
    if (t >= T.question && t < T.reponse - 0.25) {
      ecrireQuestion(x, t);
    } else {
      // La phrase reste affichée jusqu'à ce que la suivante commence.
      const p = [...minutage.phrases].reverse().find((q) => t >= q.de - 0.05) ?? minutage.phrases[0];
      ecrirePhrase(x, p, t);
    }
    tex.needsUpdate = true;
  }, [c, tex, t]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, EPAISSEUR + 0.012, 1.39]} renderOrder={3}>
      <planeGeometry args={[3.3, 3.3 * CH / CW]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

/** Le rabat qui cache la réponse pendant le compte à rebours. */
const Rabat: React.FC<{carte: THREE.Texture; consigne: THREE.Texture; chiffres: THREE.Texture[]}> = ({carte, consigne, chiffres}) => {
  const t = useCurrentFrame() / FPS;
  if (t < T.question || t > T.reponse + 0.9) return null;
  const arrivee = interpolate(t, [T.question, T.question + 0.4], [0.8, 0], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const angle = interpolate(t, [T.reponse - 0.7, T.reponse + 0.1], [0, 2.15], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
  const sortie = interpolate(t, [T.reponse + 0.2, T.reponse + 0.85], [1, 0.001], CLAMP);
  const n = t >= momentsCompte[2] ? 2 : t >= momentsCompte[1] ? 1 : t >= momentsCompte[0] ? 0 : -1;
  const dernier = n >= 0 ? momentsCompte[n] : 0;
  const tic = n >= 0 ? Math.exp(-(t - dernier) * 7) * 0.09 : 0;
  return (
    <group position={[0, EPAISSEUR + 0.03 + arrivee + tic, 1.5]} rotation={[-angle, 0, 0]} scale={[sortie, sortie, sortie]}>
      <mesh position={[0, 0, 0.58]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.012, 1.16]} />
        <meshStandardMaterial color="#e4d3b2" map={carte} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.009, 0.58]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.1, 1.21]} />
        <meshBasicMaterial map={n >= 0 ? chiffres[n] : consigne} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

// --- Les décors découpés ---
const rect = (x0: number, y0: number, x1: number, y1: number) => {
  const s = new THREE.Shape();
  s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath();
  return s;
};
const disque = (x: number, y: number, r: number) => {
  const s = new THREE.Shape();
  s.absarc(x, y, r, 0, Math.PI * 2, false);
  return s;
};

const PETIT = (() => {
  const s = new THREE.Shape();
  s.absarc(0, 0.62, 0.085, 0, Math.PI * 2, false);
  return {tete: s, corps: capsule(0, 0.1, 0, 0.42, 0.075)};
})();

const Chambre: React.FC<{carte: THREE.Texture; haloTex: THREE.Texture}> = ({carte, haloTex}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const formes = useMemo(() => {
    const couverture = new THREE.Shape();
    couverture.moveTo(-0.98, 0.62);
    couverture.bezierCurveTo(-0.9, 1.0, -0.2, 1.1, 0.15, 0.9);
    couverture.bezierCurveTo(0.45, 0.76, 0.6, 1.06, 0.9, 0.92);
    couverture.bezierCurveTo(1.25, 0.8, 1.4, 1.14, 1.68, 0.62);
    couverture.closePath();
    const cheveux = new THREE.Shape();
    cheveux.absarc(-1.24, 0.98, 0.335, Math.PI * 0.48, Math.PI * 1.5, false);
    cheveux.closePath();
    const nez = new THREE.Shape();
    nez.moveTo(-1.17, 1.27); nez.lineTo(-1.08, 1.345); nez.lineTo(-1.0, 1.2); nez.closePath();
    const intrus = new THREE.Shape();
    intrus.absarc(0, 1.86, 0.21, 0, Math.PI * 2, false);
    const buste = new THREE.Shape();
    buste.moveTo(-0.17, 1.66);
    buste.bezierCurveTo(-0.42, 1.6, -0.42, 1.3, -0.38, 0.5);
    buste.lineTo(-0.4, 0);
    buste.lineTo(0.4, 0);
    buste.lineTo(0.38, 0.5);
    buste.bezierCurveTo(0.42, 1.3, 0.42, 1.6, 0.17, 1.66);
    buste.closePath();
    const anse = new THREE.Shape();
    anse.absarc(0, 0.16, 0.17, 0, Math.PI, false);
    anse.lineTo(-0.1, 0.16);
    anse.absarc(0, 0.16, 0.1, Math.PI, 0, true);
    anse.closePath();
    return {
      mur: rect(-1.72, 0, 1.72, 2.3), fenetre: rect(-0.75, 1.15, 0.1, 2.05), lune: disque(-0.15, 1.82, 0.13),
      barreV: rect(-0.345, 1.15, -0.305, 2.05), barreH: rect(-0.75, 1.58, 0.1, 1.62),
      tete: disque(-1.24, 0.98, 0.33), cheveux, nez, couverture, intrus, buste, anse,
      blanc: disque(-1.09, 1.12, 0.075), pupille: disque(0, 0, 0.038), paupiere: disque(-1.09, 1.12, 0.08),
      tetebed: rect(-1.74, 0, -1.6, 1.15), matelas: rect(-1.6, 0.4, 1.7, 0.66), cadre: rect(-1.6, 0.14, 1.72, 0.42), pied: rect(1.58, 0, 1.72, 0.14),
      oreiller: capsule(-1.5, 0.71, -0.92, 0.71, 0.1),
      corps: capsule(-0.85, 0.82, 1.4, 0.8, 0.14),
      cerveau: disque(-1.26, 1.03, 0.2), tige: capsule(-1.14, 0.92, -1.02, 0.82, 0.035),
      cadenas: rect(-0.17, -0.14, 0.17, 0.14),
    };
  }, []);
  const courbe = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.14, 0.92, 0.12), new THREE.Vector3(-0.8, 0.84, 0.12), new THREE.Vector3(0, 0.82, 0.12), new THREE.Vector3(0.8, 0.82, 0.12), new THREE.Vector3(1.35, 0.8, 0.12),
  ]), []);
  const versIntrus = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.2, 1.2, 0.12), new THREE.Vector3(-0.4, 1.75, 0.1), new THREE.Vector3(0.4, 1.95, 0.05), new THREE.Vector3(1.05, 1.86, 0.05),
  ]), []);

  // Le lit se replie pendant les chiffres et au moment de tourner la page.
  const pli = Math.min(
    interpolate(t, [0, 0.45, T.chiffres - 0.25, T.chiffres + 0.2, T.calme - 0.3, T.calme + 0.15], [0, 1, 1, 0, 0, 1], {...CLAMP, easing: Easing.out(Easing.cubic)}),
    interpolate(t, [T.finAbonne - 0.2, T.finAbonne + 0.25], [1, 0], CLAMP),
  );
  const zoom = interpolate(t, [T.intrus - 0.1, T.intrus + 0.5], [1, 1.04], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const interieur = interpolate(t, [T.coupure, T.coupure + 0.5, T.reve - 0.2, T.reve + 0.3], [0, 1, 1, 0], CLAMP);
  const dort = interpolate(t, [T.coupure, T.coupure + 0.25, T.blocage, T.blocage + 0.2, T.calme, T.calme + 0.35], [0, 1, 1, 0, 0, 1], CLAMP);
  const presence = Math.min(
    interpolate(t, [T.intrus - 0.05, T.intrus + 0.55, T.coupure - 0.2, T.coupure + 0.2, T.reve + 1.8, T.reve + 2.4], [0, 1, 1, 0, 0, 1], CLAMP),
    interpolate(t, [T.dissout + 0.9, T.dissout + 2.1], [1, 0], CLAMP),
  );
  const cadenas = interpolate(t, [T.blocage + 0.4, T.blocage + 0.75, T.reve - 0.2, T.reve], [0, 1, 1, 0], {...CLAMP, easing: Easing.out(Easing.back(2))});
  const bleu = interpolate(t, [T.coupure + 0.4, T.coupure + 3.5], [0, 1], CLAMP);
  const regard = t < T.intrus + 0.3 ? Math.sin(t * 3.2) * 0.022 : 0.03;
  const respire = 1 + Math.sin(t * (t < T.coupure || (t > T.reve && t < T.calme) ? 7 : 2.4)) * 0.025;
  const pulse = interpolate(t, [T.coupure + 1.2, T.coupure + 2.5], [0, 1], CLAMP);
  const reveCourbe = ((t - T.reve - 2.4) % 0.9) / 0.9;
  const chiffres1 = t < ETUDIANTS - 0.1;

  return (
    <>
      <group visible={pli > 0.04} position={[0, EPAISSEUR, -0.85]} rotation={[-0.72 * pli - (1 - pli) * 1.54, 0, 0]} scale={[zoom, zoom * 1.12, zoom]}>
        <Piece forme={formes.mur} couleur="#39507f" carte={carte} z={-0.26} />
        <Piece forme={formes.fenetre} couleur="#a9c0e4" carte={carte} z={-0.22} />
        <Piece forme={formes.lune} couleur="#fff4cf" carte={carte} z={-0.2} prof={0.01} />
        <Piece forme={formes.barreV} couleur="#223154" carte={carte} z={-0.19} prof={0.01} />
        <Piece forme={formes.barreH} couleur="#223154" carte={carte} z={-0.19} prof={0.01} />
        {presence > 0.005 && (
          <group position={[1.08, 0, -0.13]} scale={[1, presence, 1]}>
            <Piece forme={formes.buste} couleur="#0d0f18" carte={carte} prof={0.02} opacite={t > T.dissout ? presence : 1} />
            <Piece forme={formes.intrus} couleur="#0d0f18" carte={carte} prof={0.02} opacite={t > T.dissout ? presence : 1} />
          </group>
        )}
        <Piece forme={formes.tetebed} couleur="#8f6b49" carte={carte} z={-0.02} />
        <Piece forme={formes.cadre} couleur="#a88a68" carte={carte} />
        <Piece forme={formes.pied} couleur="#8f6b49" carte={carte} />
        <Piece forme={formes.matelas} couleur="#f4efe3" carte={carte} z={0.02} />
        <Piece forme={formes.oreiller} couleur="#fffaf0" carte={carte} z={0.04} />
        <Piece forme={formes.corps} couleur={new THREE.Color('#e6a884').lerp(new THREE.Color('#7fb0e8'), bleu)} carte={carte} z={0.05} opacite={interieur > 0 ? 1 : 0.001} />
        <group position={[0, 0.62 * (1 - respire), 0]} scale={[1, respire, 1]}>
          <Piece forme={formes.couverture} couleur="#8a5a44" carte={carte} z={0.09} opacite={1 - interieur * 0.82} />
        </group>
        <Piece forme={formes.tete} couleur="#e6a884" carte={carte} z={0.07} />
        <Piece forme={formes.cheveux} couleur="#33241b" carte={carte} z={0.1} prof={0.015} />
        <Piece forme={formes.nez} couleur="#e6a884" carte={carte} z={0.07} />
        {interieur > 0.02 && (
          <>
            <Piece forme={formes.cerveau} couleur={new THREE.Color('#f0b0a0').lerp(new THREE.Color('#d8321c'), t > T.blocage && t < T.reve ? 0.8 : 0.25)} carte={carte} z={0.125} prof={0.01} opacite={interieur} />
            <Piece forme={formes.tige} couleur="#2f6fd0" carte={carte} z={0.125} prof={0.01} opacite={interieur} />
            <mesh>
              <tubeGeometry args={[courbe, 40, 0.014, 8, false]} />
              <meshBasicMaterial color="#2f6fd0" transparent opacity={interieur} toneMapped={false} />
            </mesh>
          </>
        )}
        {pulse > 0 && pulse < 1 && (
          <sprite position={courbe.getPoint(pulse)} scale={[0.42, 0.42, 1]}>
            <spriteMaterial map={haloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        )}
        {cadenas > 0.01 && (
          <group position={[0.45, 1.13, 0.2]} scale={[cadenas * 1.05, cadenas * 1.05, 1]}>
            <Piece forme={formes.cadenas} couleur="#b5321f" carte={carte} prof={0.02} />
            <group position={[0, 0.02, 0]}><Piece forme={formes.anse} couleur="#2a211a" carte={carte} prof={0.02} /></group>
          </group>
        )}
        {t > T.reve + 2.4 && t < T.dissout + 1 && reveCourbe > 0 && (
          <sprite position={versIntrus.getPoint(reveCourbe)} scale={[0.3, 0.3, 1]}>
            <spriteMaterial map={haloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        )}
        <Piece forme={formes.blanc} couleur="#ffffff" carte={carte} z={0.125} prof={0.008} />
        <group position={[-1.09 + regard, 1.12, 0.137]}>
          <Piece forme={formes.pupille} couleur="#111111" carte={carte} prof={0.006} />
        </group>
        {dort > 0.01 && <group position={[-1.09, 1.12, 0.145]} scale={[1, dort, 1]}>
          <group position={[1.09, -1.12, 0]}><Piece forme={formes.paupiere} couleur="#d9926f" carte={carte} prof={0.006} /></group>
        </group>}
      </group>

      {/* Les petits personnages des chiffres : treize, puis quatre. */}
      {t > T.chiffres - 0.1 && t < T.calme + 0.1 && (
        <group position={[0, EPAISSEUR, -0.9]} rotation={[-0.72, 0, 0]}>
          {(chiffres1 ? Array.from({length: 13}, (_, i) => -1.5 + i * 0.25) : [-1.05, -0.35, 0.35, 1.05]).map((x, i) => {
            const rouge = chiffres1 ? i === 6 : i === 1;
            const debut = chiffres1 ? T.chiffres + i * 0.06 : ETUDIANTS + i * 0.08;
            const e = Math.min(interpolate(t, [debut, debut + 0.25], [0, 1], {...CLAMP, easing: Easing.out(Easing.back(2))}), interpolate(t, [T.calme - 0.25, T.calme], [1, 0], CLAMP));
            const taille = chiffres1 ? 1.25 : 2.1;
            const c = rouge ? '#c8321f' : '#6b7c9c';
            return (
              <group key={`${chiffres1}-${i}`} position={[x, 0, 0]} scale={[taille, taille * Math.max(e, 0.001), taille]}>
                <Piece forme={PETIT.corps} couleur={c} carte={carte} prof={0.02} />
                <Piece forme={PETIT.tete} couleur={c} carte={carte} prof={0.02} />
              </group>
            );
          })}
        </group>
      )}
    </>
  );
};

/** La page qui se tourne, sur la dernière seconde. */
const PageTournee: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const a = interpolate(t, [T.finAbonne + 0.15, T.finAbonne + 1.4], [0, Math.PI], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
  if (a <= 0) return null;
  return (
    <group position={[0, EPAISSEUR + 0.03, 0]} rotation={[-a, 0, 0]}>
      <mesh position={[0, 0, HAUTEUR_PAGE / 2]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[LARGEUR_PAGE, HAUTEUR_PAGE - 0.02]} />
        <meshStandardMaterial color={PAPIER} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const Eclairage: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const jour = interpolate(t, [T.chiffres - 0.3, T.chiffres + 0.4], [0, 1], CLAMP);
  const couleur = new THREE.Color('#b9c8f5').lerp(new THREE.Color('#ffd9a8'), jour);
  const peur = interpolate(t, [T.intrus, T.intrus + 0.5, T.coupure, T.coupure + 0.4, T.reve, T.reve + 0.6, T.dissout + 0.9, T.dissout + 1.5], [0, 1, 1, 0, 0, 1, 1, 0], CLAMP);
  return (
    <>
      <ambientLight intensity={0.5 + jour * 0.1 - peur * 0.12} color="#e6e4f0" />
      <spotLight position={[-2.6, 9, 3]} angle={0.62} penumbra={0.85} intensity={170 - peur * 40} color={couleur} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
    </>
  );
};

const Camera: React.FC = () => {
  const f = useCurrentFrame();
  const {camera} = useThree();
  const avance = interpolate(f, [0, DUREE_LIVRE_PARALYSIE], [1.1, 1.04]);
  camera.position.set(0, 9.6 * avance, 5.45 * avance);
  camera.lookAt(0, 0.25, 0.2);
  return null;
};

export const LivreParalysie: React.FC = () => {
  const [pret, setPret] = useState(false);
  const [poignee] = useState(() => delayRender('polices du livre'));
  useEffect(() => {
    Promise.all([waitUntilDone(), document.fonts.load(`800 80px "${fontFamily}"`, 'é’'), document.fonts.load(`500 80px "${fontFamily}"`, 'é’')])
      .then(() => { setPret(true); continueRender(poignee); })
      .catch((e) => cancelRender(e));
  }, [poignee]);
  const tex = useMemo(() => (pret ? {
    bois: textureBois(), hachures: textureHachures(), halo: halo(),
    consigne: texteFixe('Réponds avant le rabat', 76, ENCRE),
    chiffres: ['3', '2', '1'].map((n) => texteFixe(n, 190, ROUGE)),
  } : null), [pret]);

  return (
    <AbsoluteFill style={{backgroundColor: '#150c07'}}>
      {tex && (
        <ThreeCanvas width={1080} height={1920} shadows camera={{fov: 35, near: 0.1, far: 60}}>
          <Camera />
          <color attach="background" args={['#150c07']} />
          <Eclairage />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial map={tex.bois} roughness={0.62} />
          </mesh>
          <Livre />
          <Chambre carte={tex.hachures} haloTex={tex.halo} />
          <Rabat carte={tex.hachures} consigne={tex.consigne} chiffres={tex.chiffres} />
          <Page />
          <PageTournee />
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
