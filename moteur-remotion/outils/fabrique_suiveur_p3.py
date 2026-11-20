"""Fabrique SuiveurP3.tsx à partir de SuiveurP2.tsx : même moteur (toon, personnage, rendu fisheye, calques),
mais huis clos dans la réserve sombre du kebab. On remplace chronologie, suiveur, caméra, téléphone, scène, son.
    python3 outils/fabrique_suiveur_p3.py"""
import pathlib
import re

KIT = pathlib.Path(__file__).resolve().parents[1] / 'src/compositions/rentree'
src = (KIT / 'SuiveurP2.tsx').read_text()
SEP = '// ================================================================== '
morceaux = src.split(SEP)
entete, sections, ordre = morceaux[0], {}, []
for m in morceaux[1:]:
    titre = m.split('\n', 1)[0]
    ordre.append(titre)
    sections[titre] = m


def remplace(prefixe, nouveau):
    for t in ordre:
        if t.startswith(prefixe):
            sections[t] = nouveau.lstrip('\n')
            return
    raise SystemExit(f'section introuvable : {prefixe}')


def retouche(prefixe, avant, apres, tout=False):
    for t in ordre:
        if t.startswith(prefixe):
            assert avant in sections[t], (prefixe, avant[:70])
            sections[t] = sections[t].replace(avant, apres) if tout else sections[t].replace(avant, apres, 1)
            return
    raise SystemExit(prefixe)


entete = entete.replace("import voix from './s01p2_voix.json';", "import voix from './s01p3_voix.json';")
entete = re.sub(r"/\*\*.*?\*/", """/**
 * T'ES BIEN RENTRÉE ? — Série 1 « Le Suiveur », partie 3 (le vote a choisi : B, elle se cache dans l'arrière-boutique).
 * Huis clos dans la réserve sombre : la voix de l'homme étouffée derrière la porte, le vendeur qui ment pour elle,
 * le filet de lumière sous la porte où passent des pieds, batterie 2 %. Il appelle le vendeur… et la poignée tourne.
 * Choix : SMS au 114 (on ne peut pas parler) ou sortir seule par la porte de service. Tout est fonction du temps t.
 */""", entete, count=1, flags=re.S)
entete = entete.replace('export const DUREE_SUIVEUR_P2', 'export const DUREE_SUIVEUR_P3')

remplace('chronologie', """chronologie (s)
const L: Record<string, number> = {
  L01: 0.5, L02: 6.0, L03: 10.0, L04: 13.8, L05: 20.0, L06: 23.8, L07: 28.4, L08: 33.4, L09: 37.4, L10: 44.0, L11: 48.0,
};
const S = {
  RECAP_FIN: 2.2, FERME: 2.2, CLOCHETTE: 3.9, BATTERIE: 28.0, BATTERIE_FIN: 32.4, VENDEUR_DEVANT: 33.1, VENDEUR_PART: 49.6,
  POIGNEE: 51.0, VOTE: 53.0,
};
const recolle = (mots) =>
  mots.reduce((acc, m) => {
    if (acc.length && !/[\\p{L}\\p{N}]/u.test(m.t)) {
      const p = acc[acc.length - 1];
      acc[acc.length - 1] = {...p, t: p.t + m.t, b: Math.max(p.b, m.b)};
    } else acc.push(m);
    return acc;
  }, []);
const LIGNES = voix.lignes.map((l) => ({...l, mots: recolle(l.mots), debut: L[l.id], fin: L[l.id] + l.duree}));

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fen = (t: number, a: number, b: number, de = 0, vers = 1, easing?: (x: number) => number) =>
  b <= a ? (t < a ? de : vers) : interpolate(t, [a, b], [de, vers], {...clamp, easing});
const doux = Easing.inOut(Easing.cubic);
type V3 = [number, number, number];
const mixv = (a: number[], b: number[], k: number) => a.map((x, i) => x + (b[i] - x) * k) as V3;

// HUD : on reprend à 02:23 (fin de la partie 2), batterie 5 % puis 2 %
const heure = (t: number) => {
  const m = 23 + Math.floor(fen(t, 0, S.VOTE, 0, 4.4));
  return `02:${String(m).padStart(2, '0')}`;
};
const minutesRestantes = (_t: number) => 5;
const batterie = (t: number) => (t < S.BATTERIE + 0.3 ? 5 : 2);

""")

remplace('le suiveur', """la réserve : une pièce à part (x de -2,2 à 2,2 ; z de -2,6 à 1,6), la porte du magasin en face de toi
const RX0 = -2.2, RX1 = 2.2, RZ0 = -2.6, RZ1 = 1.6, RH = 2.6;
const PORTE_R = 0.3; // centre de la porte qui donne sur le magasin
const SORTIE_Z = -0.6; // la porte de service, sur le mur de gauche
const ouvertureReserve = (t: number) => 0.55 * (1 - fen(t, S.FERME, S.FERME + 1.0, 0, 1, doux));
// des pieds dans le filet de lumière sous la porte : le vendeur qui monte la garde, puis quelqu'un d'autre
const piedsVendeur = (t: number) => fen(t, S.VENDEUR_DEVANT, S.VENDEUR_DEVANT + 0.5) * (1 - fen(t, S.VENDEUR_PART, S.VENDEUR_PART + 0.8));
const decaleVendeur = (t: number) => fen(t, S.VENDEUR_PART, S.VENDEUR_PART + 0.8, 0, 1.2, Easing.in(Easing.cubic));
const piedsHomme = (t: number) => fen(t, S.POIGNEE - 0.6, S.POIGNEE);
const poignee = (t: number) => fen(t, S.POIGNEE, S.POIGNEE + 0.5, 0, 0.55, doux) + (t > S.POIGNEE + 0.5 ? Math.sin((t - S.POIGNEE) * 31) * 0.05 : 0);

""")

remplace('caméra subjective', """caméra subjective : accroupie derrière les cartons, face à la porte du magasin
const OEIL = 1.15;
const P_CACHEE: V3 = [0.05, OEIL, -1.3];
const camBase = (_t: number): V3 => P_CACHEE;
const enMarche = (_t: number) => false;
const rel = (t: number, d: V3): V3 => {
  const c = camBase(t);
  return [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
};
const CIBLES: Record<string, (t: number) => V3> = {
  PORTE: () => [PORTE_R, 1.0, RZ1],
  SOL_PORTE: () => [PORTE_R, 0.25, RZ1],
  CARTONS: () => [RX1, 0.9, 0.2],
  FRIGO: () => [-1.3, 0.75, RZ0],
  SORTIE: () => [RX0, 1.35, SORTIE_Z],
  TEL: (t) => rel(t, [0.06, -0.42, 0.75]),
};
const CLES: [number, string, number][] = [
  [0, 'PORTE', 0], [L.L04 - 0.2, 'CARTONS', 0.8], [15.6, 'FRIGO', 0.8], [17.4, 'SORTIE', 0.7], [L.L05 - 0.3, 'PORTE', 0.6],
  [S.BATTERIE, 'TEL', 0.45], [S.VENDEUR_DEVANT - 0.5, 'SOL_PORTE', 0.6], [L.L09 - 0.2, 'SORTIE', 0.8], [L.L10 - 0.2, 'TEL', 0.45],
  [L.L11 - 0.4, 'PORTE', 0.6],
];
const indexCle = (t: number) => {
  let i = 0;
  while (i + 1 < CLES.length && CLES[i + 1][0] <= t) i++;
  return i;
};
const cibleA = (t: number): V3 => {
  const i = indexCle(t);
  const [t0, nom, d] = CLES[i];
  const cur = CIBLES[nom](t);
  if (i === 0 || d <= 0) return cur;
  const prev = CIBLES[CLES[i - 1][1]](t);
  return mixv(prev, cur, fen(t, t0, t0 + d, 0, 1, doux));
};
const poidsTel = (t: number) => {
  const i = indexCle(t);
  const est = CLES[i][1] === 'TEL' ? 1 : 0;
  const etait = i > 0 && CLES[i - 1][1] === 'TEL' ? 1 : 0;
  return etait + (est - etait) * fen(t, CLES[i][0], CLES[i][0] + CLES[i][2], 0, 1, doux);
};
const poseCam = (t: number) => {
  const b = camBase(t);
  const sursaut = fen(t, S.POIGNEE, S.POIGNEE + 0.12) * (1 - fen(t, S.POIGNEE + 0.12, S.POIGNEE + 0.9))
    + fen(t, S.CLOCHETTE, S.CLOCHETTE + 0.1) * (1 - fen(t, S.CLOCHETTE + 0.1, S.CLOCHETTE + 0.7)) * 0.6;
  const souffle = Math.sin(t * 2.4) * 0.008 * (1 + fen(t, L.L02, L.L02 + 2));
  const pos: V3 = [b[0] + noise2D('px', t * 0.5, 0) * 0.012, b[1] + souffle - sursaut * 0.03, b[2] + noise2D('pz', t * 0.5, 1) * 0.012];
  const c = cibleA(t);
  const tremble = 0.02 + (t > L.L02 ? 0.012 : 0) + (t > S.POIGNEE ? 0.02 : 0);
  const cible: V3 = [c[0] + noise2D('cx', t * 1.1, 0) * tremble, c[1] + noise2D('cy', t * 1.1, 1) * tremble + sursaut * 0.06, c[2] + noise2D('cz', t * 1.1, 2) * tremble];
  const roulis = noise2D('r', t * 0.8, 2) * 0.02;
  return {pos, cible, roulis};
};
const dirCam = (t: number) => {
  const {pos, cible} = poseCam(t);
  const d = new THREE.Vector3(cible[0] - pos[0], cible[1] - pos[1], cible[2] - pos[2]).normalize();
  return {lacet: Math.atan2(d.x, -d.z), tangage: Math.asin(d.y)};
};

""")

remplace('le téléphone', """le téléphone d'Inès : écran « 2 % », puis un SMS au 114 prêt à partir
const ecranTel = (etat: string) => {
  const cv = document.createElement('canvas');
  cv.width = 380; cv.height = 780;
  const g = cv.getContext('2d')!;
  if (etat === 'sms') {
    g.fillStyle = '#f4f4f8'; g.fillRect(0, 0, 380, 780);
    g.fillStyle = '#e6e6ee'; g.fillRect(0, 0, 380, 150);
    g.fillStyle = '#2f6fb0'; g.beginPath(); g.arc(190, 70, 38, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 30px sans-serif'; g.fillText('114', 190, 81);
    g.fillStyle = '#222'; g.font = '700 22px sans-serif'; g.fillText('Urgence SMS', 190, 135);
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(20, 640, 340, 70, 34); g.fill();
    g.strokeStyle = '#c9c9d6'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#2f6fb0'; g.fillRect(44, 655, 4, 40);
    g.fillStyle = '#d4412e'; g.textAlign = 'right'; g.font = '800 24px sans-serif'; g.fillText('2 %', 360, 30);
  } else {
    const f = g.createLinearGradient(0, 0, 0, 780);
    f.addColorStop(0, '#3a3270'); f.addColorStop(1, '#b4507a');
    g.fillStyle = f; g.fillRect(0, 0, 380, 780);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 96px sans-serif'; g.fillText(etat === 'bat' ? '02:25' : '02:23', 190, 210);
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.roundRect(26, 300, 328, 130, 30); g.fill();
    g.fillStyle = '#d4412e'; g.beginPath(); g.arc(78, 365, 30, 0, 7); g.fill();
    g.fillStyle = '#222'; g.textAlign = 'left'; g.font = '800 30px sans-serif'; g.fillText('Batterie faible', 124, 356);
    g.font = '600 24px sans-serif'; g.fillText(etat === 'bat' ? '2 % restants' : '5 % restants', 124, 392);
  }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const Telephone: React.FC<{mat: THREE.Material}> = ({mat}) => (
  <group>
    <T g={G.boite} c={'#f2d4dc'} s={[0.074, 0.152, 0.01]} />
    <mesh position={[0, 0, 0.0052]} material={mat}><planeGeometry args={[0.065, 0.142]} /></mesh>
  </group>
);
const Mains: React.FC<{t: number}> = ({t}) => {
  const etat = t < S.BATTERIE - 0.3 ? 'cinq' : t < L.L10 - 0.3 ? 'bat' : 'sms';
  const mat = useTexMat(etat, () => ecranTel(etat));
  const leve = poidsTel(t);
  const sonne = t >= S.BATTERIE && t < S.BATTERIE + 0.5 ? Math.sin(t * 190) * 0.003 : 0;
  return (
    <group position={[0.07 + sonne - leve * 0.04, -0.27 + leve * 0.15, -0.33 + leve * 0.03]} rotation={[0.5 + leve * 0.25, -0.15 + leve * 0.1, 0.06]} scale={1.5}>
      <T g={G.capsule} c={C.manche} p={[0.035, -0.125, 0.03]} r={[-0.45, 0, 0.35]} s={[0.032, 0.075, 0.032]} />
      <T g={G.sphere} c={C.peauInes} p={[0.012, -0.04, -0.016]} s={[0.04, 0.048, 0.019]} />
      <Telephone mat={mat} />
      <T g={G.capsule} c={C.peauInes} p={[-0.036, -0.032, 0.012]} r={[0.2, 0, -0.5]} s={[0.011, 0.023, 0.011]} />
      {[-0.034, -0.008, 0.018, 0.042].map((y, i) => (
        <group key={i}>
          <T g={G.capsule} c={C.peauInes} p={[0.041, y - 0.012, 0.006]} r={[0, 0, 0.25]} s={[0.0092, 0.012, 0.0092]} />
          <mesh geometry={G.sphere} material={plat('#c2185b')} position={[0.045, y - 0.003, 0.012]} scale={[0.006, 0.006, 0.003]} />
        </group>
      ))}
    </group>
  );
};

""")

retouche('rendu fisheye', "const peur = fen(t, L.L06, L.L06 + 2) * 0.4 + fen(t, S.DEBOUT, S.A_LA_PORTE) * 0.6;",
         "const peur = 0.35 + fen(t, L.L02, L.L02 + 2) * 0.25 + fen(t, S.POIGNEE, S.POIGNEE + 1.5) * 0.4;")

remplace('scène', """scène : la réserve
export const STYLE_HOMME: Style = {peau: '#d9a27a', haut: '#4a4e5e', bas: '#2a2d38', chaussures: '#e8e8e8', cheveux: '#1d1410', coiffure: 'court', capucheTete: true};
const panneauSortie = () => {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 192;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#1aa75a'; g.fillRect(0, 0, 512, 192);
  g.fillStyle = '#ffffff'; g.font = '800 92px sans-serif'; g.textAlign = 'center'; g.fillText('SORTIE', 300, 128);
  g.fillRect(40, 50, 60, 96); g.fillStyle = '#1aa75a'; g.fillRect(52, 62, 36, 84);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(122, 66, 12, 0, 7); g.fill(); g.fillRect(112, 82, 18, 44);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const CARTONS: [number, number, number, number][] = [
  // x, y (bas), z, taille
  [1.85, 0.02, -1.6, 0.5], [1.85, 0.52, -1.6, 0.42], [1.9, 0.02, -1.0, 0.45], [1.9, 0.02, 0.6, 0.5], [1.88, 0.52, 0.6, 0.38],
  [0.85, 0.02, -0.95, 0.55], [0.4, 0.02, -0.85, 0.42], [-0.6, 0.02, -0.9, 0.36],
];
const OMBRE = new THREE.MeshBasicMaterial({color: '#0a0810', transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false});
const Reserve: React.FC<{t: number}> = ({t}) => {
  const matSortie = useTexMat('sortie', panneauSortie);
  const l = RX1 - RX0, cz = (RZ0 + RZ1) / 2, prof = RZ1 - RZ0;
  const ouv = ouvertureReserve(t);
  const px0 = PORTE_R - 0.45, px1 = PORTE_R + 0.45;
  return (
    <group>
      {/* sol, plafond, murs */}
      <T g={G.boite} c={'#6e6a76'} p={[0, 0, cz]} s={[l, 0.02, prof]} contour={false} />
      <T g={G.boite} c={'#3e3c48'} p={[0, RH, cz]} s={[l, 0.06, prof]} />
      <T g={G.boite} c={'#857e90'} p={[0, RH / 2, RZ0]} s={[l, RH, 0.08]} />
      <T g={G.boite} c={'#5f5a6a'} p={[RX0, RH / 2, cz]} s={[0.08, RH, prof]} />
      <T g={G.boite} c={'#5f5a6a'} p={[RX1, RH / 2, cz]} s={[0.08, RH, prof]} />
      {/* mur du magasin avec la porte */}
      <T g={G.boite} c={'#6a6474'} p={[(RX0 + px0) / 2, RH / 2, RZ1]} s={[px0 - RX0, RH, 0.08]} />
      <T g={G.boite} c={'#6a6474'} p={[(px1 + RX1) / 2, RH / 2, RZ1]} s={[RX1 - px1, RH, 0.08]} />
      <T g={G.boite} c={'#6a6474'} p={[PORTE_R, (2.08 + RH) / 2, RZ1]} s={[0.9, RH - 2.08, 0.08]} />
      {/* derrière la porte : la lumière du magasin */}
      <mesh position={[PORTE_R, 1.1, RZ1 + 0.35]} geometry={G.boite} scale={[1.4, 2.4, 0.02]} material={plat('#ffd9a0')} />
      {/* le filet de lumière sous la porte, et sa flaque sur le sol */}
      <mesh position={[PORTE_R, 0.05, RZ1 - 0.03]} geometry={G.boite} scale={[0.86, 0.1, 0.002]} material={plat('#ffd9a0')} />
      <mesh position={[PORTE_R, 0.013, RZ1 - 0.55]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.boite} scale={[0.86, 1.05, 0.001]} material={halo('#ffb860', 0.3)} />
      <mesh position={[PORTE_R, 0.014, RZ1 - 0.3]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.boite} scale={[0.86, 0.55, 0.001]} material={halo('#ffc070', 0.25 + ouv * 0.3)} />
      {/* les pieds dans la lumière : le vendeur (deux ombres), puis l'homme */}
      {[0, 1].map((k) => {
        const x = PORTE_R - 0.2 + k * 0.34 + decaleVendeur(t);
        const vu = piedsVendeur(t) > 0.02 && x < PORTE_R + 0.45;
        return (
          <group key={`v${k}`} visible={vu}>
            <mesh position={[x, 0.05, RZ1 - 0.035]} geometry={G.boite} scale={[0.15, 0.1, 0.002]} material={plat('#120e14')} />
            <mesh position={[x - 0.03, 0.016, RZ1 - 0.5]} rotation={[-Math.PI / 2, 0, -0.08]} geometry={G.boite} scale={[0.13, 0.95, 0.001]} material={OMBRE} />
          </group>
        );
      })}
      {[0, 1].map((k) => (
        <group key={`h${k}`} visible={piedsHomme(t) > 0.02}>
          <mesh position={[PORTE_R - 0.12 + k * 0.24, 0.05, RZ1 - 0.036]} geometry={G.boite} scale={[0.16 * piedsHomme(t), 0.1, 0.002]} material={plat('#120e14')} />
          <mesh position={[PORTE_R - 0.12 + k * 0.24, 0.017, RZ1 - 0.55]} rotation={[-Math.PI / 2, 0, 0.05]} geometry={G.boite} scale={[0.15 * piedsHomme(t), 1.05, 0.001]} material={OMBRE} />
        </group>
      ))}
      {/* la porte, charnière à droite, entrouverte au début ; la poignée tournera à la fin */}
      <group position={[px1, 0, RZ1]} rotation={[0, ouv, 0]}>
        <T g={G.boite} c={'#9a7254'} p={[-0.45, 1.1, 0]} s={[0.88, 2.0, 0.05]} />
        <group position={[-0.8, 1.0, -0.05]} rotation={[0, 0, poignee(t)]}>
          <T g={G.boite} c={'#c9c9d2'} p={[0.06, 0, 0]} s={[0.14, 0.025, 0.025]} />
        </group>
        <mesh position={[-0.8, 0.92, -0.03]} geometry={G.boite} scale={[0.012, 0.025, 0.01]} material={plat('#ffcf88')} />
      </group>
      {/* la porte de service, le panneau SORTIE */}
      <group position={[RX0 + 0.045, 0, SORTIE_Z]}>
        <T g={G.boite} c={'#3a4048'} p={[0, 1.04, 0]} s={[0.04, 2.06, 0.92]} />
        <T g={G.boite} c={'#9aa0a8'} p={[0.05, 1.0, 0]} s={[0.04, 0.06, 0.7]} />
        <mesh position={[0.05, 2.3, 0]} rotation={[0, Math.PI / 2, 0]} material={matSortie}><planeGeometry args={[0.6, 0.225]} /></mesh>
        <mesh position={[0.08, 2.3, 0]} geometry={G.sphere} scale={[0.06, 0.16, 0.42]} material={halo('#4aff8a', 0.12)} />
        <mesh position={[0.4, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={[0.6, 0.6, 1]} material={halo('#4aff8a', 0.08)} />
      </group>
      {/* étagère et cartons */}
      <T g={G.boite} c={'#8a8f98'} p={[RX1 - 0.25, 1.3, -0.3]} s={[0.5, 0.04, 2.6]} />
      <T g={G.boite} c={'#8a8f98'} p={[RX1 - 0.25, 1.9, -0.3]} s={[0.5, 0.04, 2.6]} />
      {[-1.5, -0.3, 0.9].map((z) => <T key={z} g={G.boite} c={'#8a8f98'} p={[RX1 - 0.25, 1.2, z]} s={[0.04, 2.4, 0.04]} />)}
      {[[-1.3, 1.32], [-0.6, 1.32], [0.3, 1.32], [-1.0, 1.92], [0.5, 1.92]].map(([z, y], k) => (
        <T key={k} g={G.boite} c={['#d4412e', '#e9e2d4', '#3f8a3a', '#f2c14e', '#2f6fb0'][k]} p={[RX1 - 0.25, y + 0.15, z]} s={[0.3, 0.3, 0.35]} />
      ))}
      {CARTONS.map(([x, y, z, s], k) => (
        <group key={k}>
          <T g={G.boite} c={k % 2 ? '#a8784a' : '#b98a5a'} p={[x, y + s / 2, z]} s={[s, s, s * 0.9]} />
          <mesh position={[x, y + s + 0.001, z]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.boite} scale={[0.08, s * 0.9, 0.001]} material={plat('#d9c39a')} />
        </group>
      ))}
      {/* le frigo coffre, sa lueur bleue */}
      <T g={G.boite} c={'#e4e6ee'} p={[-1.3, 0.45, RZ0 + 0.4]} s={[1.3, 0.9, 0.7]} />
      <mesh position={[-1.3, 0.75, RZ0 + 0.76]} geometry={G.boite} scale={[1.1, 0.04, 0.01]} material={plat('#8fd0ff')} />
      <mesh position={[-1.3, 0.6, RZ0 + 0.9]} geometry={G.sphere} scale={[0.9, 0.5, 0.3]} material={halo('#7fb6ff', 0.12)} />
      {/* seau et balai près de la sortie */}
      <T g={G.cylindre} c={'#d4412e'} p={[RX0 + 0.45, 0.17, SORTIE_Z + 0.75]} s={[0.17, 0.34, 0.17]} />
      <T g={G.cylindre} c={'#8a6a44'} p={[RX0 + 0.5, 0.75, SORTIE_Z + 0.78]} r={[0.15, 0, 0.12]} s={[0.015, 1.4, 0.015]} />
      {/* ampoule éteinte */}
      <T g={G.sphere} c={'#cfcfd8'} p={[0, RH - 0.15, -0.4]} s={[0.06, 0.08, 0.06]} />
    </group>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const mains = useRef<THREE.Group>(null);
  const ouv = ouvertureReserve(t);
  return (
    <>
      <color attach="background" args={['#0a0b14']} />
      <ambientLight intensity={1.05} color={'#7a84b8'} />
      <hemisphereLight intensity={0.4} color={'#9aa4d8'} groundColor={'#3a3238'} />
      {/* la lumière du magasin qui passe sous la porte (plus forte tant qu'elle est entrouverte) */}
      <pointLight position={[PORTE_R, 0.25, RZ1 - 0.2]} intensity={0.9 + ouv * 1.6} decay={0} distance={3.6} color={'#ffc880'} />
      <pointLight position={[-1.3, 1.0, RZ0 + 0.9]} intensity={0.55} decay={0} distance={2.4} color={'#7fb0ff'} />
      <pointLight position={[RX0 + 0.3, 2.2, SORTIE_Z]} intensity={0.45} decay={0} distance={2.2} color={'#5aff9a'} />
      <Reserve t={t} />
      <group ref={mains}>
        <Mains t={t} />
      </group>
      <Rendu t={t} mains={mains} />
    </>
  );
};

""")

retouche('calques', "LE SUIVEUR · PARTIE 2", "LE SUIVEUR · PARTIE 3", tout=True)
retouche('calques', "  if (t >= S.VOTE || t < S.RECAP_FIN) return null;\n  const bas = batterie(t) <= 5;", "  if (t >= S.VOTE || t < S.RECAP_FIN) return null;\n  const bas = batterie(t) <= 2;")
retouche('calques', "Il entre. Tu appelles le 17, ou tu te caches&nbsp;?", "Tu écris au 114, ou tu sors par la ruelle&nbsp;?")
retouche('calques', "{carte('A', \"J'appelle le 17\", '#ffd23f', k(0.7), -1)}", "{carte('A', \"J'envoie un SMS au 114\", '#ffd23f', k(0.7), -1)}")
retouche('calques', "{carte('B', \"Je me cache dans l'arrière-boutique\", '#fffaf1', k(1.1), 1)}", "{carte('B', 'Je sors par la porte de service', '#fffaf1', k(1.1), 1)}")
retouche('calques', "La partie 3 suivra vos votes", "La fin (partie 4) suivra vos votes")
retouche('calques', "const COULEURS: Record<string, string> = {INES: '#ffffff', VENDEUR: '#9fe0ff'};\nconst ETIQUETTE: Record<string, string> = {VENDEUR: 'LE VENDEUR'};",
         "const COULEURS: Record<string, string> = {INES: '#ffffff', VENDEUR: '#9fe0ff', VENDEUR_P: '#9fe0ff', HOMME_P: '#ff6b5a'};\n"
         "const ETIQUETTE: Record<string, string> = {VENDEUR: 'LE VENDEUR · TOUT PRÈS', VENDEUR_P: 'LE VENDEUR · DERRIÈRE LA PORTE', HOMME_P: 'LUI · DERRIÈRE LA PORTE'};")
retouche('calques', "staticFile('rentree/p1_fin.jpg')", "staticFile('rentree/p2_fin.jpg')")
retouche('calques', "<div style={{marginTop: 24, background: '#ffd23f',", "<div style={{marginTop: 24, background: '#fffaf1',")
retouche('calques', "color: '#ffd23f', fontSize: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>A</div>",
         "color: '#fffaf1', fontSize: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>B</div>")
retouche('calques', "<div style={{fontSize: 64, color: TRAIT, lineHeight: 1.02}}>J'entre dans le kebab</div>",
         "<div style={{fontSize: 58, color: TRAIT, lineHeight: 1.02}}>Je me cache dans l'arrière-boutique</div>")

remplace('son', """son (bruitages synthétisés de Tu Fais Quoi, réutilisés)
const fr = (s: number) => Math.round(s * FPS);
const Son: React.FC<{a: number; src: string; v?: number; d?: number; boucle?: boolean; fondu?: [number, number]; vitesse?: number}> = ({a, src, v = 1, d, boucle, fondu, vitesse}) => (
  <Sequence from={fr(a)} durationInFrames={d ? fr(d) : undefined} layout="none">
    <Audio src={staticFile(`metro/sons/${src}.wav`)} loop={boucle} playbackRate={vitesse}
      volume={(f) => {
        if (!fondu) return v;
        const tt = f / FPS;
        const dd = d ?? 999;
        return v * Math.min(1, tt / Math.max(0.01, fondu[0])) * Math.max(0, Math.min(1, (dd - tt) / Math.max(0.01, fondu[1])));
      }} />
  </Sequence>
);
const BandeSon: React.FC = () => (
  <>
    {LIGNES.map((l) => (
      <Sequence key={l.id} from={fr(l.debut)} layout="none">
        <Audio src={staticFile(l.fichier)} />
      </Sequence>
    ))}
    <Son a={0} src="impact" v={0.5} />
    <Son a={S.FERME + 0.7} src="porte" v={0.45} />
    <Son a={S.CLOCHETTE} src="ding" v={0.3} />
    {/* le ronronnement du frigo, tout du long */}
    <Son a={0.3} src="drone" v={0.16} d={S.VOTE - 0.3} boucle fondu={[1.0, 0.3]} vitesse={0.8} />
    {[L.L04 - 0.2, 15.6, 17.4, L.L05 - 0.3, S.VENDEUR_DEVANT - 0.5, L.L09 - 0.2, L.L11 - 0.4].map((a) => <Son key={a} a={a} src="whoosh" v={0.14} />)}
    <Son a={S.BATTERIE} src="vibre" v={0.4} />
    <Son a={S.BATTERIE + 0.05} src="alerte" v={0.12} d={0.6} />
    <Son a={S.VENDEUR_DEVANT - 0.3} src="pas" v={0.14} d={0.8} fondu={[0.1, 0.2]} />
    <Son a={L.L05 + 1.0} src="battement" v={0.4} d={S.VOTE - L.L05 - 1.0} boucle fondu={[1.5, 0.05]} />
    <Son a={S.VENDEUR_PART} src="pas" v={0.16} d={1.0} fondu={[0.1, 0.4]} />
    <Son a={S.POIGNEE - 0.7} src="pas" v={0.2} d={0.7} fondu={[0.1, 0.1]} vitesse={0.9} />
    <Son a={S.POIGNEE} src="clic" v={0.6} />
    <Son a={S.POIGNEE + 0.05} src="impact" v={0.75} />
    <Son a={S.POIGNEE + 0.5} src="porte" v={0.4} />
    <Son a={S.VOTE - 2.2} src="montee" v={0.28} />
    <Son a={S.VOTE} src="impact" v={0.75} />
    <Son a={S.VOTE + 0.7} src="pop" v={0.45} />
    <Son a={S.VOTE + 1.1} src="pop" v={0.45} />
    <Son a={S.VOTE + 3.05} src="pop" v={0.6} />
    <Son a={S.VOTE + 4.2} src="vibre" v={0.5} />
    <Son a={S.VOTE + 0.2} src="drone" v={0.16} d={T_FIN - S.VOTE - 0.2} fondu={[0.5, 1.2]} />
  </>
);

export const SuiveurP3: React.FC = () => {
  const {width, height} = useVideoConfig();
  const t = useCurrentFrame() / FPS;
  const flouVote = fen(t, S.VOTE, S.VOTE + 0.4, 0, 9);
  return (
    <AbsoluteFill style={{backgroundColor: C.coin}}>
      <AbsoluteFill style={{filter: flouVote > 0 ? `blur(${flouVote}px)` : undefined}}>
        <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.NoToneMapping}} flat camera={{fov: 108, near: 0.02, far: 95}}>
          <Scene />
        </ThreeCanvas>
      </AbsoluteFill>
      <Hud />
      <CarteNotif debut={S.BATTERIE} fin={S.BATTERIE_FIN} couleur="#d4412e" icone="🪫" titre="Batterie faible" texte="2 % restants. Le téléphone va s'éteindre." />
      <SousTitres />
      <Recap />
      <Vote />
      <BandeSon />
    </AbsoluteFill>
  );
};
""")

sortie = entete + ''.join(SEP + sections[t] for t in ordre)
(KIT / 'SuiveurP3.tsx').write_text(sortie)
print('ok', len(sortie.splitlines()), 'lignes')
