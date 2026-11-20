import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import ancresBrutes from './ancres_knuckle.json';

/**
 * Prototype « Lesson » (TikTok 9:16, muet) : le prof ouvre la leçon au tableau,
 * la main dessinée à la craie devient la main 3D (Blender, learn-tiktok/proto_knuckle),
 * puis plongée dans l'articulation jusqu'au POP de la bulle de gaz.
 */
const {fontFamily: CRAIE} = loadCaveat();
const {fontFamily: SANS} = loadInter();

type Ancre = [number, number, number];
type Ancres = Record<string, Ancre | number>;
const ANCRES = ancresBrutes as unknown as Record<string, Ancres>;

const DEBUT_3D = 150;          // image de la vidéo où commence la 3D
const N3D = 450;               // images Blender 0..450
const POP = 330;               // image Blender du POP
export const DUREE_KNUCKLE_LESSON = DEBUT_3D + N3D + 120;

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const JAUNE = '#FFD84D', BLEU = '#7EC8FF', CRAIE_C = '#F4F1E6';

const ancre = (bf: number, nom: string): Ancre | null => {
  const a = ANCRES[String(Math.min(Math.max(Math.round(bf), 0), N3D))];
  const v = a?.[nom];
  return Array.isArray(v) ? (v as Ancre) : null;
};

// Hauteur visible de la scène (cm) d'après les clés caméra de scene.py
const HAUTEUR_CM: [number, number][] = [[0, 24], [90, 9.2], [170, 4.3], [260, 2.8], [330, 2.1], [450, 1.83]];
const hauteurVisible = (bf: number) => {
  for (let i = 0; i < HAUTEUR_CM.length - 1; i++) {
    const [a, ha] = HAUTEUR_CM[i], [b, hb] = HAUTEUR_CM[i + 1];
    if (bf <= b) {
      const t = (bf - a) / (b - a), s = t * t * (3 - 2 * t);
      return ha + (hb - ha) * s;
    }
  }
  return HAUTEUR_CM[HAUTEUR_CM.length - 1][1];
};

const SOUS_TITRES: {a: number; b: number; t: string; fort?: string}[] = [
  {a: 0, b: 70, t: 'Okay class.', fort: 'class'},
  {a: 70, b: 150, t: "What's REALLY inside a knuckle crack?", fort: 'REALLY'},
  {a: 150, b: 240, t: "Let's open it up.", fort: 'open'},
  {a: 240, b: 345, t: 'Two bones, capped with smooth cartilage.', fort: 'cartilage'},
  {a: 345, b: 410, t: 'Sealed in a capsule full of fluid.', fort: 'fluid'},
  {a: 410, b: 480, t: 'Pull them apart… the pressure drops…', fort: 'drops'},
  {a: 480, b: 570, t: 'POP. A gas bubble is born.', fort: 'bubble'},
  {a: 570, b: 650, t: "THAT's the sound you hear.", fort: "THAT's"},
];

const Tableau: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2E5A47 0%, #1F3F33 55%, #142A22 100%)'}}>
    <svg width="100%" height="100%" style={{position: 'absolute', opacity: .22, mixBlendMode: 'screen'}}>
      <filter id="poussiere"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.18" /></filter>
      <rect width="100%" height="100%" filter="url(#poussiere)" />
    </svg>
    <div style={{position: 'absolute', left: 80, top: 1500, width: 700, height: 160, borderRadius: 80,
      background: 'rgba(255,255,255,.04)', filter: 'blur(30px)', transform: 'rotate(-6deg)'}} />
    {children}
  </AbsoluteFill>
);

const Etapes: React.FC<{bf: number; apparition: number}> = ({bf, apparition}) => {
  const noms = ['The joint', 'The fluid', 'The pop', 'The myth'];
  const actif = bf < 250 ? 0 : bf < POP ? 1 : 2;
  return (
    <div style={{position: 'absolute', top: 110, left: 60, right: 60, opacity: apparition,
      transform: `translateY(${(1 - apparition) * -40}px)`}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: 'rgba(255,255,255,.75)',
        marginBottom: 14}}>LESSON 01 · BIOLOGY</div>
      <div style={{display: 'flex', gap: 12}}>
        {noms.map((n, i) => {
          const fait = i < actif, encours = i === actif;
          return (
            <div key={n} style={{flex: 1}}>
              <div style={{height: 10, borderRadius: 5, background: 'rgba(255,255,255,.18)', overflow: 'hidden'}}>
                <div style={{height: '100%', width: fait ? '100%' : encours ? '55%' : '0%',
                  background: encours ? JAUNE : 'rgba(255,255,255,.85)'}} />
              </div>
              <div style={{fontFamily: SANS, fontWeight: encours ? 800 : 600, fontSize: 28, marginTop: 10,
                color: encours ? JAUNE : 'rgba(255,255,255,.6)'}}>{i + 1}. {n}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Etiquette: React.FC<{bf: number; nom: string; texte: string; depuis: number; cote: 1 | -1; couleur: string; dy?: number}> =
  ({bf, nom, texte, depuis, cote, couleur, dy = 0}) => {
    const {width, height} = useVideoConfig();
    const a = ancre(bf, nom);
    if (!a || bf < depuis) return null;
    const [x, y, z] = a;
    if (z <= 0 || x < -.1 || x > 1.1 || y < -.1 || y > 1.1) return null;
    const t = interpolate(bf, [depuis, depuis + 14], [0, 1], cl);
    const px = x * width, py = y * height;
    const lx = cote > 0 ? width - 330 : 60, ly = py + dy;
    const finX = cote > 0 ? lx : lx + 270;
    return (
      <>
        <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0}}>
          <line x1={px} y1={py} x2={px + (finX - px) * t} y2={py + (ly - py) * t} stroke={couleur} strokeWidth={4} />
          <circle cx={px} cy={py} r={12 * t} fill={couleur} stroke="#0B1020" strokeWidth={4} />
        </svg>
        <div style={{position: 'absolute', left: lx, top: ly - 34, width: 270, opacity: t,
          transform: `translateX(${(1 - t) * 30 * cote}px)`, textAlign: cote > 0 ? 'left' : 'right'}}>
          <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 38, color: '#0B1020', background: couleur,
            padding: '8px 16px', borderRadius: 12, boxShadow: '0 6px 0 rgba(0,0,0,.35)'}}>{texte}</span>
        </div>
      </>
    );
  };

const Regle: React.FC<{bf: number; apparition: number}> = ({bf, apparition}) => {
  const {height} = useVideoConfig();
  const longueur = 360;
  const cm = hauteurVisible(bf) * longueur / height;
  const valeur = cm >= 1 ? `${cm.toFixed(1)} cm` : `${(cm * 10).toFixed(1)} mm`;
  return (
    <div style={{position: 'absolute', left: 50, top: 760, opacity: apparition}}>
      <div style={{width: 10, height: longueur, background: 'rgba(255,255,255,.9)', borderRadius: 5, position: 'relative'}}>
        {[0, .25, .5, .75, 1].map((k) => (
          <div key={k} style={{position: 'absolute', left: 10, top: k * longueur - 2, width: k % .5 === 0 ? 26 : 16,
            height: 4, background: 'rgba(255,255,255,.9)'}} />
        ))}
      </div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 34, color: '#fff', marginTop: 12,
        textShadow: '0 3px 8px rgba(0,0,0,.7)', fontVariantNumeric: 'tabular-nums'}}>{valeur}</div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 22, color: 'rgba(255,255,255,.65)', letterSpacing: 2}}>SCALE</div>
    </div>
  );
};

const Pression: React.FC<{bf: number}> = ({bf}) => {
  const vis = interpolate(bf, [252, 262, 336, 350], [0, 1, 1, 0], cl);
  if (vis <= 0) return null;
  const niveau = interpolate(bf, [262, 330], [1, .12], cl);
  return (
    <div style={{position: 'absolute', right: 56, top: 760, opacity: vis, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{width: 46, height: 360, borderRadius: 23, border: '5px solid #fff', position: 'relative', overflow: 'hidden',
        background: 'rgba(0,0,0,.35)'}}>
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: `${niveau * 100}%`,
          background: niveau < .35 ? '#FF5A4D' : BLEU}} />
      </div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 26, color: '#fff', marginTop: 12, textAlign: 'center',
        textShadow: '0 3px 8px rgba(0,0,0,.7)'}}>PRESSURE<br />▼</div>
    </div>
  );
};

const SousTitre: React.FC<{f: number}> = ({f}) => {
  const st = SOUS_TITRES.find((s) => f >= s.a && f < s.b);
  if (!st) return null;
  const surCraie = f < DEBUT_3D;
  const t = interpolate(f, [st.a, st.a + 6], [0, 1], cl);
  const nettoie = (m: string) => m.replace(/[^\w']/g, '');
  return (
    <div style={{position: 'absolute', left: 70, right: 70, bottom: 300, textAlign: 'center', opacity: t,
      transform: `scale(${.92 + .08 * t})`}}>
      <span style={{fontFamily: surCraie ? CRAIE : SANS, fontWeight: surCraie ? 700 : 900,
        fontSize: surCraie ? 84 : 62, lineHeight: 1.15, color: CRAIE_C,
        textShadow: surCraie ? '0 0 6px rgba(255,255,255,.25)' : '0 4px 0 #000, 0 0 24px rgba(0,0,0,.8)',
        WebkitTextStroke: surCraie ? undefined : '2px #000'}}>
        {st.t.split(' ').map((m, i) => (
          <span key={i} style={{color: st.fort && nettoie(m) === nettoie(st.fort) ? JAUNE : undefined}}>{m} </span>
        ))}
      </span>
    </div>
  );
};

export const KnuckleLesson: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bf = Math.min(Math.max(f - DEBUT_3D, 0), N3D);

  // --- tableau ---
  const tag = spring({frame: f - 4, fps, config: {damping: 12}});
  const titre = interpolate(f, [10, 52], [100, 0], cl);
  const dessin = interpolate(f, [44, 118], [100, 0], cl);
  const fondu = interpolate(f, [128, 168], [1, 0], cl);
  const lueur = interpolate(f, [118, 140, 175], [0, 1, 0], cl);
  const craie = interpolate(f, [150, 182], [1, 0], cl);

  // --- 3D ---
  const opa3d = interpolate(f, [132, 168], [0, 1], cl);
  const hud = interpolate(f, [175, 200], [0, 1], cl);
  const pop = bf >= POP ? Math.exp(-(bf - POP) / 5) : 0;
  const secousse = bf >= POP && bf < POP + 12 ? (1 - (bf - POP) / 12) * 14 : 0;
  const sx = Math.sin(f * 2.3) * secousse, sy = Math.cos(f * 3.1) * secousse;
  const popTexte = spring({frame: bf - POP, fps, config: {damping: 9, stiffness: 220}});
  const popVis = interpolate(bf, [POP, POP + 2, POP + 32, POP + 42], [0, 1, 1, 0], cl);
  const fin = interpolate(f, [DEBUT_3D + N3D, DEBUT_3D + N3D + 15], [0, 1], cl);
  const src = staticFile(`lesson_knuckle/3d/f${String(bf).padStart(4, '0')}.jpg`);

  return (
    <AbsoluteFill style={{backgroundColor: '#05080F'}}>
      <AbsoluteFill style={{opacity: opa3d, transform: `translate(${sx}px, ${sy}px) scale(${1 + secousse * .002})`}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>

      {fondu > 0 && (
        <AbsoluteFill style={{opacity: fondu}}>
          <Tableau>
            <div style={{position: 'absolute', top: 120, left: 70, transform: `scale(${tag})`, transformOrigin: 'left center',
              fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: 5, color: '#142A22', background: JAUNE,
              padding: '10px 22px', borderRadius: 10}}>LESSON 01 · BIOLOGY</div>
            <div style={{position: 'absolute', top: 200, left: 70, right: 60, fontFamily: CRAIE, fontWeight: 700, fontSize: 118,
              lineHeight: 1.0, color: CRAIE_C, clipPath: `inset(0 ${titre}% 0 0)`, textShadow: '0 0 8px rgba(255,255,255,.25)'}}>
              Why do knuckles <span style={{color: JAUNE}}>crack?</span>
            </div>
          </Tableau>
        </AbsoluteFill>
      )}

      {craie > 0 && (
        <AbsoluteFill style={{opacity: craie, clipPath: `inset(${dessin}% 0 0 0)`,
          filter: `drop-shadow(0 0 ${4 + lueur * 26}px rgba(255,240,180,${.3 + lueur * .7}))`}}>
          <Img src={staticFile('lesson_knuckle/craie_main.png')} style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      )}

      {f >= DEBUT_3D && (
        <>
          <Etiquette bf={bf} nom="bone" texte="BONE" depuis={180} cote={-1} couleur="#F2E3C6" dy={-60} />
          <Etiquette bf={bf} nom="cartilage" texte="CARTILAGE" depuis={200} cote={1} couleur={BLEU} dy={-120} />
          <Etiquette bf={bf} nom="capsule" texte="CAPSULE" depuis={222} cote={1} couleur="#F7C9A0" dy={60} />
          <Etiquette bf={bf} nom="fluid" texte="FLUID" depuis={256} cote={-1} couleur={JAUNE} dy={90} />
          <Etiquette bf={bf} nom="bubble" texte="GAS BUBBLE" depuis={POP + 14} cote={1} couleur="#BFE8FF" dy={-200} />
          <Regle bf={bf} apparition={hud} />
          <Pression bf={bf} />
          <Etapes bf={bf} apparition={hud} />
        </>
      )}

      {pop > 0 && <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, rgba(220,240,255,${pop * .9}), rgba(255,255,255,${pop * .35}) 60%)`}} />}
      {popVis > 0 && (
        <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', opacity: popVis,
          transform: `scale(${.4 + popTexte * .6}) rotate(-6deg)`, fontFamily: SANS, fontWeight: 900, fontSize: 220,
          color: '#fff', WebkitTextStroke: '8px #0B1020', paintOrder: 'stroke fill', textShadow: '0 12px 0 #0B1020'}}>POP!</div>
      )}

      <SousTitre f={f} />

      {fin > 0 && (
        <AbsoluteFill style={{background: `rgba(5,8,15,${fin * .55})`, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 520}}>
          <div style={{opacity: fin, transform: `translateY(${(1 - fin) * 40}px)`, background: JAUNE, borderRadius: 26,
            padding: '26px 40px', maxWidth: 880, textAlign: 'center', boxShadow: '0 10px 0 rgba(0,0,0,.45)'}}>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 4, color: '#142A22'}}>POP QUIZ</div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 56, color: '#0B1020', lineHeight: 1.1, marginTop: 8}}>
              What gas is inside that bubble? 👇</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
