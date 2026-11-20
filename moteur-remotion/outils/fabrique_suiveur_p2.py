"""Fabrique SuiveurP2.tsx à partir de SuiveurP1.tsx : on garde toon, personnage, ville, rendu fisheye, calques ;
on remplace la chronologie, la caméra, le suiveur, la scène, le son, et on ajoute l'intérieur du kebab."""
import pathlib
import re

KIT = pathlib.Path(__file__).resolve().parents[1] / 'src/compositions/rentree'
src = (KIT / 'SuiveurP1.tsx').read_text()
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


def retouche(prefixe, avant, apres):
    for t in ordre:
        if t.startswith(prefixe):
            assert avant in sections[t], (prefixe, avant[:70])
            sections[t] = sections[t].replace(avant, apres, 1)
            return
    raise SystemExit(prefixe)


entete = entete.replace("import voix from './s01p1_voix.json';", "import voix from './s01p2_voix.json';")
entete = re.sub(r"/\*\*.*?\*/", """/**
 * T'ES BIEN RENTRÉE ? — Série 1 « Le Suiveur », partie 2 (le vote a choisi : A, elle entre dans le kebab).
 * Elle demande « Angela » au vendeur, passe derrière le comptoir ; dehors, l'homme s'assoit sur le banc d'en face.
 * Batterie 5 %. Puis il se lève et vient jusqu'à la porte. Choix : appeler le 17, ou se cacher dans l'arrière-boutique.
 * Même moteur que la partie 1, plus l'intérieur du kebab. Tout est fonction du temps t.
 */""", entete, count=1, flags=re.S)
entete = entete.replace('export const DUREE_SUIVEUR_P1', 'export const DUREE_SUIVEUR_P2')

remplace('chronologie', """chronologie (s)
const L: Record<string, number> = {
  L01: 0.5, L02: 4.9, L03: 8.0, L04: 12.6, L05: 16.2, L06: 22.0, L07: 27.6, L08: 31.6, L09: 35.6, L10: 41.6,
};
const S = {
  RECAP_FIN: 2.2, PORTE: 1.8, DEDANS: 4.4, CONTOURNE: 18.4, DERRIERE: 21.0, TRAVERSE: 21.6, ASSIS: 26.4,
  BATTERIE: 31.2, BATTERIE_FIN: 35.0, SMS: 35.3, SMS_FIN: 38.6, DEBOUT: 41.4, VIENT: 42.4, A_LA_PORTE: 50.4, VOTE: 52.0,
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

// HUD : on reprend à 02:19 (fin de la partie 1), batterie 8 % puis 5 %
const heure = (t: number) => {
  const m = 19 + Math.floor(fen(t, 0, S.VOTE, 0, 4.4));
  return `02:${String(m).padStart(2, '0')}`;
};
const minutesRestantes = (_t: number) => 5;
const batterie = (t: number) => (t < S.BATTERIE + 0.3 ? 8 : 5);

""")

# Perso : on remet la position assise
retouche('personnage', "export const Perso: React.FC<any> = ({p, rotY = 0, marche = 0,", "export const Perso: React.FC<any> = ({p, rotY = 0, assis = 0, marche = 0,")
retouche('personnage', "  const hanche = 0.86;\n", "  const hanche = 0.86 + (0.5 - 0.86) * assis;\n")
retouche('personnage', "const jambe = (k: number) => ({h: marche * k * pas * 0.5, g: marche * Math.max(0, -k * pas) * 0.8});",
         "const jambe = (k: number) => ({h: -assis * Math.PI / 2 + marche * k * pas * 0.5, g: assis * Math.PI / 2 + marche * Math.max(0, -k * pas) * 0.8});")

remplace('la marche', """le kebab : tout est placé autour de sa vitrine
const KEBAB_X = -61.0;
const IX0 = KEBAB_X - 3.2, IX1 = KEBAB_X + 3.2; // largeur de la boutique
const Z_VITRE = 10.8, Z_FOND = 15.9;
const PORTE_X = KEBAB_X + 1.6; // la porte vitrée

""")

remplace('le suiveur', """le suiveur : dehors devant la vitrine, puis sur le banc d'en face, puis à la porte
const BANC: V3 = [KEBAB_X - 0.6, 0, -0.35];
const DEHORS: V3 = [KEBAB_X + 5.6, 0, 9.4];
const PORTE_DEHORS: V3 = [PORTE_X, 0, 10.15];
const hommeP = (t: number): V3 => {
  if (t < S.TRAVERSE) return DEHORS;
  if (t < S.ASSIS) return mixv(DEHORS, BANC, fen(t, S.TRAVERSE, S.ASSIS - 0.3, 0, 1, Easing.inOut(Easing.sin)));
  if (t < S.VIENT) return BANC;
  return mixv(BANC, PORTE_DEHORS, fen(t, S.VIENT, S.A_LA_PORTE, 0, 1, Easing.inOut(Easing.sin)));
};
const hommeMarche = (t: number) => ((t > S.TRAVERSE && t < S.ASSIS - 0.3) || (t > S.VIENT && t < S.A_LA_PORTE - 0.2) ? 1 : 0);
const hommeAssis = (t: number) => fen(t, S.ASSIS - 0.3, S.ASSIS + 0.5, 0, 1, doux) * (1 - fen(t, S.DEBOUT, S.DEBOUT + 0.7, 0, 1, doux));

""")

remplace('caméra subjective', """caméra subjective : dehors → la porte → devant le comptoir → derrière le comptoir
const OEIL = 1.6;
const P_DEHORS: V3 = [PORTE_X + 0.1, OEIL, 9.3];
const P_ENTREE: V3 = [PORTE_X - 0.1, OEIL, 12.2];
const P_COIN: V3 = [KEBAB_X + 2.3, OEIL, 13.4];
const P_DERRIERE: V3 = [KEBAB_X + 1.15, OEIL, 15.05];
const camBase = (t: number): V3 => {
  if (t < S.DEDANS) return mixv(P_DEHORS, P_ENTREE, fen(t, S.PORTE + 0.3, S.DEDANS, 0, 1, Easing.inOut(Easing.sin)));
  if (t < S.CONTOURNE + 1.2) return mixv(P_ENTREE, P_COIN, fen(t, S.CONTOURNE, S.CONTOURNE + 1.2, 0, 1, Easing.in(Easing.sin)));
  return mixv(P_COIN, P_DERRIERE, fen(t, S.CONTOURNE + 1.2, S.DERRIERE, 0, 1, Easing.out(Easing.sin)));
};
const enMarche = (t: number) => (t > S.PORTE + 0.4 && t < S.DEDANS - 0.2) || (t > S.CONTOURNE + 0.2 && t < S.DERRIERE - 0.2);
const rel = (t: number, d: V3): V3 => {
  const c = camBase(t);
  return [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
};
const VENDEUR_P: V3 = [KEBAB_X - 0.45, 0, 14.95];
const CIBLES: Record<string, (t: number) => V3> = {
  PORTE: () => [PORTE_X, 1.4, 14.0],
  TEL: (t) => rel(t, [0.06, -0.42, -0.75]),
  VENDEUR: () => [VENDEUR_P[0], 1.62, VENDEUR_P[2]],
  STICKER: () => [KEBAB_X - 1.2, 1.4, Z_VITRE],
  COMPTOIR: () => [KEBAB_X - 1.0, 1.1, 14.0],
  HOMME: (t) => {
    const h = hommeP(t);
    return [h[0], 1.5 - 0.35 * hommeAssis(t), h[2]];
  },
};
const CLES: [number, string, number][] = [
  [0, 'PORTE', 0], [L.L02 - 0.3, 'VENDEUR', 0.6], [L.L03 - 0.2, 'STICKER', 0.7], [L.L04 - 0.3, 'VENDEUR', 0.6],
  [S.CONTOURNE, 'COMPTOIR', 0.8], [S.DERRIERE - 0.4, 'HOMME', 0.9], [L.L07 - 0.2, 'VENDEUR', 0.6], [S.BATTERIE - 0.1, 'TEL', 0.45],
  [L.L09 - 0.3, 'VENDEUR', 0.55], [39.4, 'HOMME', 0.8],
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
  const pas = enMarche(t) ? 1 : 0;
  const b = camBase(t);
  const sursaut = fen(t, L.L10, L.L10 + 0.12) * (1 - fen(t, L.L10 + 0.12, L.L10 + 0.9));
  const pos: V3 = [b[0] + noise2D('px', t * 0.6, 0) * 0.01, b[1] + pas * Math.abs(Math.sin(t * 5.6)) * 0.03 + sursaut * 0.03, b[2] + noise2D('pz', t * 0.6, 1) * 0.01];
  const c = cibleA(t);
  const tremble = 0.022 + (t > S.DERRIERE ? 0.012 : 0) + (t > S.DEBOUT ? 0.02 : 0);
  const cible: V3 = [c[0] + noise2D('cx', t * 1.1, 0) * tremble, c[1] + noise2D('cy', t * 1.1, 1) * tremble + sursaut * 0.08, c[2] + noise2D('cz', t * 1.1, 2) * tremble];
  const roulis = noise2D('r', t * 0.8, 2) * 0.02;
  return {pos, cible, roulis};
};
const dirCam = (t: number) => {
  const {pos, cible} = poseCam(t);
  const d = new THREE.Vector3(cible[0] - pos[0], cible[1] - pos[1], cible[2] - pos[2]).normalize();
  return {lacet: Math.atan2(d.x, -d.z), tangage: Math.asin(d.y)};
};

""")

retouche('la ville', "  return out;\n})();\nconst Immeuble", """  // la boutique occupe [IX0, IX1] côté +z : on y recoupe les immeubles
  const coupe: typeof out = [];
  for (const b of out) {
    const x0 = b.x - b.l / 2, x1 = b.x + b.l / 2;
    if (b.cote < 0 || x1 <= IX0 || x0 >= IX1) { coupe.push(b); continue; }
    if (IX0 - x0 > 0.4) coupe.push({...b, x: (x0 + IX0) / 2, l: IX0 - x0 - 0.05});
    if (x1 - IX1 > 0.4) coupe.push({...b, x: (IX1 + x1) / 2, l: x1 - IX1 - 0.05, i: b.i + 500});
  }
  return coupe;
})();
const Immeuble""")
retouche('la ville', "const Kebab: React.FC<{t: number}> = ({t}) => {\n  const matV = useTexMat('vitrine', vitrineKebab);\n", "const Kebab: React.FC<{t: number}> = ({t}) => {\n")
retouche('la ville', "      <mesh position={[0, 1.3, 0]} material={matV}><planeGeometry args={[4.2, 2.36]} /></mesh>\n      <T g={G.boite} c={'#2a1e26'} p={[0, 1.3, 0.04]} s={[4.4, 0.12, 0.08]} />\n", "")
retouche('la ville', "      <mesh position={[0, 1.3, 0.3]} geometry={G.sphere} scale={[2.6, 1.6, 0.4]} material={halo('#ffcf7a', 0.12)} />\n", "")
retouche('la ville', "    <mesh position={[marcheX(t), 0, 4]} geometry={G.sphere} scale={[85, 85, 85]} material={matCiel} renderOrder={-1} />\n    <mesh position={[marcheX(t) - 40, 30, -30]}",
         "    <mesh position={[KEBAB_X, 0, 4]} geometry={G.sphere} scale={[85, 85, 85]} material={matCiel} renderOrder={-1} />\n    <mesh position={[KEBAB_X - 40, 30, -30]}")
retouche('la ville', "    <Kebab t={t} />\n  </group>\n);", """    <Kebab t={t} />
    <Boutique t={t} />
    {/* le banc d'en face, sous son lampadaire */}
    <Lampadaire x={BANC[0] + 1.1} z={-1.2} s={-1} />
    <group position={BANC}>
      <T g={G.boite} c={'#5a3a2a'} p={[0, 0.45, 0]} s={[1.8, 0.08, 0.45]} />
      <T g={G.boite} c={'#5a3a2a'} p={[0, 0.78, -0.22]} s={[1.8, 0.4, 0.06]} />
      {[-0.75, 0.75].map((x) => <T key={x} g={G.boite} c={'#232733'} p={[x, 0.22, 0]} s={[0.08, 0.44, 0.4]} />)}
      <mesh position={[0, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, 0]} geometry={G.disque} scale={1.8} material={halo('#ffb070', 0.32)} />
    </group>
  </group>
);""")
retouche('la ville', "const Ville: React.FC<{t: number}> = ({t}) => (", """const autocollantAngela = () => {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#6a2c91'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 222, 0, 7); g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center';
  g.font = '700 54px sans-serif'; g.fillText('ICI,', 256, 170);
  g.font = '800 64px sans-serif'; g.fillText('DEMANDEZ', 256, 250);
  g.fillStyle = '#ffd36b'; g.font = '800 96px sans-serif'; g.fillText('ANGELA', 256, 345);
  g.fillStyle = '#ffffff'; g.font = '600 30px sans-serif'; g.fillText('lieu sûr', 256, 410);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const menuKebab = () => {
  const cv = document.createElement('canvas');
  cv.width = 768; cv.height = 256;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#2a2230'; g.fillRect(0, 0, 768, 256);
  g.fillStyle = '#ffd36b'; g.font = '800 54px sans-serif'; g.fillText('MENU', 30, 70);
  g.fillStyle = '#ffffff'; g.font = '700 38px sans-serif';
  [['Sandwich', '7,50'], ['Assiette', '11,00'], ['Tacos', '8,50'], ['Boisson', '2,00']].forEach(([n, p], k) => {
    const x = 30 + (k % 2) * 380, y = 140 + Math.floor(k / 2) * 70;
    g.fillText(n, x, y); g.fillStyle = '#ff8a6a'; g.fillText(`${p} €`, x + 220, y); g.fillStyle = '#ffffff';
  });
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
};
const matVitre = new THREE.MeshBasicMaterial({color: '#bcd8ff', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false});
const FACADE_BOUTIQUE = '#6e2f2a';
const Boutique: React.FC<{t: number}> = ({t}) => {
  const matSticker = useTexMat('angela', autocollantAngela);
  const matMenu = useTexMat('menu', menuKebab);
  const l = IX1 - IX0, cx = (IX0 + IX1) / 2, prof = Z_FOND - Z_VITRE, cz = (Z_VITRE + Z_FOND) / 2;
  const ouverture = fen(t, S.PORTE, S.PORTE + 0.7, 0, 1.25, doux) * (1 - fen(t, S.DEDANS + 0.3, S.DEDANS + 1.1, 0, 1, doux))
    + fen(t, S.A_LA_PORTE + 0.4, S.VOTE, 0, 0.18, doux); // à la fin : la porte qui s'entrouvre
  const vx0 = KEBAB_X - 2.1, vx1 = KEBAB_X + 2.1;
  return (
    <group>
      {/* l'étage au-dessus de la boutique */}
      <T g={G.boite} c={'#7a6a88'} p={[cx, 7.2, cz + 0.5]} s={[l, 8.2, prof + 1]} />
      {[0, 1, 2].map((e) => [0, 1, 2, 3].map((k) => (
        <mesh key={`${e}${k}`} position={[IX0 + (k + 0.5) * (l / 4), 4.4 + e * 2.4, Z_VITRE - 0.01]} geometry={G.boite} scale={[0.75, 1.15, 0.02]}
          material={plat((e + k) % 3 === 0 ? '#ffcf7a' : '#1c1a2e')} />
      )))}
      {/* façade avec le trou de la vitrine */}
      <T g={G.boite} c={FACADE_BOUTIQUE} p={[cx, 2.95, Z_VITRE]} s={[l, 0.9, 0.12]} />
      <T g={G.boite} c={FACADE_BOUTIQUE} p={[cx, 0.08, Z_VITRE]} s={[l, 0.16, 0.12]} />
      <T g={G.boite} c={FACADE_BOUTIQUE} p={[(IX0 + vx0) / 2, 1.3, Z_VITRE]} s={[vx0 - IX0, 2.5, 0.12]} />
      <T g={G.boite} c={FACADE_BOUTIQUE} p={[(vx1 + IX1) / 2, 1.3, Z_VITRE]} s={[IX1 - vx1, 2.5, 0.12]} />
      <mesh position={[(vx0 + PORTE_X - 0.5) / 2, 1.33, Z_VITRE]} material={matVitre}><planeGeometry args={[PORTE_X - 0.5 - vx0, 2.34]} /></mesh>
      {[vx0, PORTE_X - 0.5, vx1].map((x) => <T key={x} g={G.boite} c={'#1d1820'} p={[x, 1.33, Z_VITRE]} s={[0.07, 2.36, 0.1]} />)}
      <T g={G.boite} c={'#1d1820'} p={[KEBAB_X, 2.5, Z_VITRE]} s={[4.3, 0.07, 0.1]} />
      <mesh position={[KEBAB_X - 1.2, 1.4, Z_VITRE + 0.012]} material={matSticker}><planeGeometry args={[0.42, 0.42]} /></mesh>
      {/* la porte vitrée, charnière côté droit */}
      <group position={[vx1, 0, Z_VITRE]} rotation={[0, -ouverture, 0]}>
        <mesh position={[-0.5, 1.33, 0]} material={matVitre}><planeGeometry args={[1.0, 2.34]} /></mesh>
        <T g={G.boite} c={'#1d1820'} p={[-0.5, 0.18, 0]} s={[1.0, 0.07, 0.08]} />
        <T g={G.boite} c={'#c9c9d2'} p={[-0.9, 1.1, 0.06]} s={[0.04, 0.4, 0.04]} />
        <T g={G.boite} c={'#c9c9d2'} p={[-0.9, 1.1, -0.06]} s={[0.04, 0.4, 0.04]} />
      </group>
      {/* l'intérieur */}
      <T g={G.boite} c={'#cdb79a'} p={[cx, 0.0, cz]} s={[l, 0.02, prof]} contour={false} />
      {Array.from({length: 7}, (_, k) => <mesh key={k} position={[IX0 + (k + 0.5) * (l / 7), 0.012, cz]} geometry={G.boite} scale={[0.02, 0.005, prof]} material={plat('#b9a184')} />)}
      <T g={G.boite} c={'#fbf1dc'} p={[cx, 3.1, cz]} s={[l, 0.08, prof]} />
      <T g={G.boite} c={'#f1dcb2'} p={[cx, 1.55, Z_FOND]} s={[l, 3.1, 0.1]} />
      <T g={G.boite} c={'#ecd3a4'} p={[IX0, 1.55, cz]} s={[0.1, 3.1, prof]} />
      <T g={G.boite} c={'#ecd3a4'} p={[IX1, 1.55, cz]} s={[0.1, 3.1, prof]} />
      <T g={G.boite} c={'#d9a04a'} p={[cx, 0.6, Z_FOND - 0.06]} s={[l, 1.2, 0.04]} contour={false} />
      {[-1.6, 1.6].map((dx) => <mesh key={dx} position={[KEBAB_X + dx, 3.05, 13.2]} rotation={[Math.PI / 2, 0, 0]} geometry={G.disque} scale={0.35} material={plat('#fff3d6')} />)}
      {/* le comptoir, la vitrine réfrigérée */}
      <T g={G.boite} c={'#8a5a3a'} p={[(IX0 + 0.5 + KEBAB_X + 1.0) / 2, 0.52, 13.95]} s={[KEBAB_X + 1.0 - IX0 - 0.5, 1.04, 0.7]} />
      <T g={G.boite} c={'#ece6da'} p={[(IX0 + 0.5 + KEBAB_X + 1.0) / 2, 1.07, 13.95]} s={[KEBAB_X + 1.0 - IX0 - 0.4, 0.06, 0.8]} />
      <mesh position={[KEBAB_X - 1.2, 1.3, 13.75]} geometry={G.boite} scale={[2.2, 0.38, 0.02]} material={matVitre} />
      {[-2.0, -1.5, -1.0, -0.5].map((dx, k) => <T key={dx} g={G.boite} c={['#3f8a3a', '#d4412e', '#f2c14e', '#e9e2d4'][k]} p={[KEBAB_X + dx, 1.16, 14.0]} s={[0.4, 0.1, 0.35]} />)}
      {/* la broche, sa plaque chauffante, le menu, le frigo à boissons */}
      <mesh position={[KEBAB_X - 1.6, 1.45, Z_FOND - 0.1]} geometry={G.boite} scale={[0.7, 1.2, 0.04]} material={plat('#ff7a3a')} />
      <T g={G.cylindre} c={'#9a5a2a'} p={[KEBAB_X - 1.6, 1.45, Z_FOND - 0.42]} s={[0.2, 1.0, 0.2]} />
      <T g={G.cylindre} c={'#9aa0a8'} p={[KEBAB_X - 1.6, 1.45, Z_FOND - 0.42]} s={[0.02, 1.3, 0.02]} />
      <mesh position={[KEBAB_X + 0.6, 2.35, Z_FOND - 0.07]} material={matMenu}><planeGeometry args={[2.4, 0.8]} /></mesh>
      <group position={[IX1 - 0.45, 0, 15.2]}>
        <T g={G.boite} c={'#e9e9ef'} p={[0, 1.0, 0]} s={[0.7, 2.0, 0.6]} />
        <mesh position={[-0.351, 1.05, 0]} rotation={[0, -Math.PI / 2, 0]} material={plat('#cfeaff')}><planeGeometry args={[0.5, 1.6]} /></mesh>
        {[0.5, 0.9, 1.3, 1.7].map((y, k) => <mesh key={y} position={[-0.355, y, 0]} geometry={G.boite} scale={[0.01, 0.12, 0.45]} material={plat(['#d4412e', '#3f8a3a', '#f2c14e', '#2f6fb0'][k])} />)}
      </group>
      <T g={G.cylindre} c={'#2a2228'} p={[KEBAB_X - 2.2, 0.38, 11.7]} s={[0.04, 0.76, 0.04]} />
      <T g={G.cylindre} c={'#e9e2d4'} p={[KEBAB_X - 2.2, 0.77, 11.7]} s={[0.4, 0.04, 0.4]} />
    </group>
  );
};

const Ville: React.FC<{t: number}> = ({t}) => (""")

retouche('le téléphone', "g.fillText(etat === 'bat' ? '02:18' : '02:14', 190, 210);", "g.fillText(etat === 'bat' ? '02:21' : '02:19', 190, 210);")
retouche('le téléphone', "g.fillText(etat === 'bat' ? '8 % restants' :", "g.fillText(etat === 'bat' ? '5 % restants' :")
retouche('le téléphone', "  const etat = t < S.VOCAL - 0.3 ? 'vtc' : t < S.BATTERIE - 0.3 ? 'jade' : 'bat';", "  const etat = t < S.BATTERIE - 0.3 ? 'jade' : 'bat';")
retouche('le téléphone', "  const sonne = (t < 1.2 || (t >= S.VOCAL && t < S.VOCAL + 0.5)) ?", "  const sonne = ((t >= S.BATTERIE && t < S.BATTERIE + 0.5) || (t >= S.SMS && t < S.SMS + 0.5)) ?")

retouche('rendu fisheye', "const peur = fen(t, L.L04, L.L04 + 2) * 0.5 + fen(t, L.L07, L.L07 + 1) * 0.5;", "const peur = fen(t, L.L06, L.L06 + 2) * 0.4 + fen(t, S.DEBOUT, S.A_LA_PORTE) * 0.6;")

remplace('scène', """scène
export const STYLE_HOMME: Style = {peau: '#d9a27a', haut: '#4a4e5e', bas: '#2a2d38', chaussures: '#e8e8e8', cheveux: '#1d1410', coiffure: 'court', capucheTete: true};
const STYLE_VENDEUR: Style = {peau: '#c98a5a', haut: '#f4f1ea', bas: '#2a2a35', chaussures: '#1d1d22', cheveux: '#2a1c16', coiffure: 'court'};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const mains = useRef<THREE.Group>(null);
  const cam = poseCam(t).pos;
  const h = hommeP(t);
  const assis = hommeAssis(t);
  // il marche vers le banc (dos à la boutique), s'assoit face à la vitrine, puis revient droit sur la porte
  const versBanc = t > S.TRAVERSE && t < S.ASSIS - 0.3;
  const rotH = versBanc ? Math.atan2(BANC[0] - DEHORS[0], BANC[2] - DEHORS[2]) : Math.atan2(cam[0] - h[0], cam[2] - h[2]);
  const rotV = Math.atan2(cam[0] - VENDEUR_P[0], cam[2] - VENDEUR_P[2]);
  return (
    <>
      <color attach="background" args={['#060818']} />
      <ambientLight intensity={1.15} color={'#9aa6e6'} />
      <hemisphereLight intensity={0.5} color={'#b4c0ff'} groundColor={'#4a3a40'} />
      <directionalLight position={[-20, 25, -10]} intensity={0.45} color={'#b9c4ff'} />
      {/* la lumière chaude de la boutique (coupée à 6,5 m : la rue reste dans la nuit) */}
      <pointLight position={[KEBAB_X, 2.7, 13.3]} intensity={1.7} decay={0} distance={6.5} color={'#ffd6a0'} />
      <Ville t={t} />

      <Perso p={VENDEUR_P} rotY={rotV} style={STYLE_VENDEUR} tete={viser([VENDEUR_P[0], 1.66, VENDEUR_P[2]], cam, rotV, 0.7)}
        bouche={parle(['VENDEUR'], t)} cligne={cligne(t, 3)} sourcils={t > L.L05 ? 0.6 : 0}
        brasD={[-1.0, 0.15, -0.6]} brasG={[-1.0, 0.15, -0.6]} />
      <Perso p={h} rotY={rotH} style={STYLE_HOMME} marche={hommeMarche(t)} phase={t * 5.6} assis={assis}
        tete={versBanc ? [0, 0.3] : viser([h[0], 1.66 - 0.36 * assis, h[2]], cam, rotH)} cligne={cligne(t, 2)}
        brasD={t > S.A_LA_PORTE - 0.3 ? [-1.45, 0.1, -0.35] : [-0.05, 0.08, -0.25]} brasG={[-0.05, 0.08, -0.25]} />

      <group ref={mains}>
        <Mains t={t} />
      </group>
      <Rendu t={t} mains={mains} />
    </>
  );
};

""")

retouche('calques', "LE SUIVEUR · PARTIE 1", "LE SUIVEUR · PARTIE 2")
retouche('calques', "  if (t >= S.VOTE) return null;\n  const bas = batterie(t) <= 8;",
         "  if (t >= S.VOTE || t < S.RECAP_FIN) return null;\n  const bas = batterie(t) <= 5;")
retouche('calques', "  const avance = vocal ? fen(t, L.L03, L.L03 + 3.57) : 0;", "  const avance = 0;")
retouche('calques', "Tu entres dans le kebab, ou tu changes de trottoir&nbsp;?", "Il entre. Tu appelles le 17, ou tu te caches&nbsp;?")
retouche('calques', "{carte('A', \"J'entre dans le kebab\", '#ffd23f', k(0.7), -1)}", "{carte('A', \"J'appelle le 17\", '#ffd23f', k(0.7), -1)}")
retouche('calques', "{carte('B', 'Je change de trottoir', '#fffaf1', k(1.1), 1)}", "{carte('B', \"Je me cache dans l'arrière-boutique\", '#fffaf1', k(1.1), 1)}")
retouche('calques', "La partie 2 suivra vos votes", "La partie 3 suivra vos votes")
retouche('calques', "const COULEURS: Record<string, string> = {INES: '#ffffff', JADE: '#ff9fbf', HOMME: '#ff6b5a'};\nconst ETIQUETTE: Record<string, string> = {JADE: 'JADE · MESSAGE VOCAL', HOMME: 'DERRIÈRE TOI'};",
         "const COULEURS: Record<string, string> = {INES: '#ffffff', VENDEUR: '#9fe0ff'};\nconst ETIQUETTE: Record<string, string> = {VENDEUR: 'LE VENDEUR'};")
retouche('calques', "const SousTitres: React.FC = () => {", """// récap : la dernière image de la partie 1, floutée, avec le choix des abonnés
const Recap: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fps} = useVideoConfig();
  if (t > S.RECAP_FIN + 0.5) return null;
  const s = spring({frame: t * fps, fps, config: {damping: 12, stiffness: 200}});
  const out = fen(t, S.RECAP_FIN, S.RECAP_FIN + 0.5);
  return (
    <AbsoluteFill style={{opacity: 1 - out, fontFamily: BALOO, fontWeight: 800}}>
      <Img src={staticFile('rentree/p1_fin.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px) brightness(0.55)'}} />
      <div style={{position: 'absolute', top: 560, left: 70, right: 70, textAlign: 'center', transform: `scale(${0.7 + 0.3 * s})`}}>
        <div style={{display: 'inline-block', background: '#fffaf1', color: TRAIT, border: `7px solid ${TRAIT}`, borderRadius: 22, padding: '4px 26px', fontSize: 44}}>LE SUIVEUR · PARTIE 2</div>
        <div style={{color: '#fff', fontSize: 70, marginTop: 40, ...contourTexte(12)}}>Vous avez choisi</div>
        <div style={{marginTop: 24, background: '#ffd23f', border: `8px solid ${TRAIT}`, borderRadius: 40, boxShadow: `0 16px 0 ${TRAIT}`, padding: '24px 30px',
          display: 'flex', alignItems: 'center', gap: 26, textAlign: 'left'}}>
          <div style={{width: 110, height: 110, borderRadius: 55, background: TRAIT, color: '#ffd23f', fontSize: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>A</div>
          <div style={{fontSize: 64, color: TRAIT, lineHeight: 1.02}}>J'entre dans le kebab</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
const SousTitres: React.FC = () => {""")

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
    <Son a={0} src="vent" v={0.14} d={S.DEDANS} fondu={[0.3, 0.8]} boucle />
    <Son a={S.DEDANS - 0.4} src="drone" v={0.12} d={S.VOTE - S.DEDANS + 0.4} boucle fondu={[1.0, 0.3]} />
    <Son a={S.PORTE} src="porte" v={0.5} />
    <Son a={S.PORTE + 0.15} src="ding" v={0.4} />
    <Son a={S.DEDANS + 0.4} src="porte" v={0.35} />
    <Son a={S.PORTE + 0.3} src="pas" v={0.28} d={S.DEDANS - S.PORTE - 0.3} boucle fondu={[0.2, 0.3]} />
    <Son a={S.CONTOURNE + 0.2} src="pas" v={0.28} d={S.DERRIERE - S.CONTOURNE - 0.2} boucle fondu={[0.2, 0.3]} />
    <Son a={S.TRAVERSE} src="pas" v={0.08} d={S.ASSIS - S.TRAVERSE - 0.3} boucle fondu={[0.5, 0.3]} vitesse={0.93} />
    <Son a={S.VIENT} src="pas" v={0.1} d={S.A_LA_PORTE - S.VIENT} boucle fondu={[0.6, 0.1]} vitesse={0.95} />
    {[L.L02 - 0.3, L.L03 - 0.2, L.L04 - 0.3, S.DERRIERE - 0.4, L.L07 - 0.2, L.L09 - 0.3, 39.4].map((a) => <Son key={a} a={a} src="whoosh" v={0.18} />)}
    <Son a={S.BATTERIE} src="vibre" v={0.55} />
    <Son a={S.BATTERIE + 0.05} src="alerte" v={0.16} d={0.7} />
    <Son a={S.SMS} src="vibre" v={0.55} />
    <Son a={S.DEBOUT} src="impact" v={0.8} />
    <Son a={S.DEBOUT + 0.5} src="battement" v={0.5} d={S.VOTE - S.DEBOUT - 0.5} boucle fondu={[0.8, 0.05]} />
    <Son a={S.A_LA_PORTE + 0.3} src="porte" v={0.55} />
    <Son a={S.VOTE - 2.2} src="montee" v={0.3} />
    <Son a={S.VOTE} src="impact" v={0.75} />
    <Son a={S.VOTE + 0.7} src="pop" v={0.45} />
    <Son a={S.VOTE + 1.1} src="pop" v={0.45} />
    <Son a={S.VOTE + 3.05} src="pop" v={0.6} />
    <Son a={S.VOTE + 4.2} src="vibre" v={0.5} />
    <Son a={S.VOTE + 0.2} src="drone" v={0.16} d={T_FIN - S.VOTE - 0.2} fondu={[0.5, 1.2]} />
  </>
);

export const SuiveurP2: React.FC = () => {
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
      <CarteNotif debut={S.BATTERIE} fin={S.BATTERIE_FIN} couleur="#d4412e" icone="🪫" titre="Batterie faible" texte="5 % restants. Le téléphone va bientôt s'éteindre." />
      <CarteNotif debut={S.SMS} fin={S.SMS_FIN} couleur="#e88aa6" icone="💛" titre="Jade" texte="T'es où ?? Réponds stp 😟" />
      <SousTitres />
      <Recap />
      <Vote />
      <BandeSon />
    </AbsoluteFill>
  );
};
""")

sortie = entete + ''.join(SEP + sections[t] for t in ordre)
(KIT / 'SuiveurP2.tsx').write_text(sortie)
print('ok', len(sortie.splitlines()), 'lignes')
