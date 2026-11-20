import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import ancresBrutes from './ancres_rip.json';

/**
 * Prototype « Life 101 · How to escape a rip current » (TikTok 9:16, muet).
 * Tableau du prof → la plage dessinée à la craie devient la plage 3D (Blender, learn-tiktok/proto_rip)
 * → repérer le courant → la mauvaise réaction → rembobinage → la bonne réaction → quiz.
 */
const {fontFamily: CRAIE} = loadCaveat();
const {fontFamily: SANS} = loadInter();

type Ancre = [number, number, number];
const ANCRES = ancresBrutes as unknown as Record<string, Record<string, Ancre>>;

const DEBUT_3D = 150, N3D = 450;
export const DUREE_RIP_LESSON = DEBUT_3D + N3D + 150;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const JAUNE = '#FFD84D', CYAN = '#5FE0FF', ROUGE = '#FF4B3E', VERT = '#3BE37A', CRAIE_C = '#F4F1E6';

const ancre = (bf: number, nom: string): Ancre | null => {
  const a = ANCRES[String(Math.min(Math.max(Math.round(bf), 0), N3D))];
  return a?.[nom] ?? null;
};

const SOUS_TITRES: {a: number; b: number; t: string; fort?: string}[] = [
  {a: 0, b: 70, t: 'Okay class. Survival lesson.', fort: 'Survival'},
  {a: 70, b: 150, t: 'How do you escape a rip current?', fort: 'escape'},
  {a: 150, b: 215, t: "Look at this beach. Where's the danger?", fort: 'danger'},
  {a: 215, b: 290, t: "That calm-looking gap? That's the rip.", fort: 'rip'},
  {a: 290, b: 365, t: 'It can drag you out at 8 feet per second.', fort: '8'},
  {a: 365, b: 425, t: 'Most people swim straight back to shore…', fort: 'straight'},
  {a: 425, b: 440, t: '…and run out of energy.', fort: 'energy'},
  {a: 440, b: 520, t: "Don't fight it. Swim PARALLEL to the shore.", fort: 'PARALLEL'},
  {a: 520, b: 600, t: 'Then let the waves carry you in.', fort: 'waves'},
];

const Tableau: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2E5A47 0%, #1F3F33 55%, #142A22 100%)'}}>
    <svg width="100%" height="100%" style={{position: 'absolute', opacity: .22, mixBlendMode: 'screen'}}>
      <filter id="poussiereRip"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.18" /></filter>
      <rect width="100%" height="100%" filter="url(#poussiereRip)" />
    </svg>
    {children}
  </AbsoluteFill>
);

const Etapes: React.FC<{bf: number; vis: number}> = ({bf, vis}) => {
  const noms = ['Spot it', "Don't fight", 'Swim parallel'];
  const actif = bf < 150 ? 0 : bf < 290 ? 1 : 2;
  return (
    <div style={{position: 'absolute', top: 100, left: 60, right: 60, opacity: vis}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: 'rgba(255,255,255,.85)',
        marginBottom: 14, textShadow: '0 2px 8px rgba(0,0,0,.6)'}}>LIFE 101 · LESSON 02</div>
      <div style={{display: 'flex', gap: 12}}>
        {noms.map((n, i) => {
          const fait = i < actif, encours = i === actif;
          return (
            <div key={n} style={{flex: 1}}>
              <div style={{height: 10, borderRadius: 5, background: 'rgba(0,0,0,.3)', overflow: 'hidden'}}>
                <div style={{height: '100%', width: fait ? '100%' : encours ? '55%' : '0%', background: encours ? JAUNE : '#fff'}} />
              </div>
              <div style={{fontFamily: SANS, fontWeight: encours ? 900 : 700, fontSize: 30, marginTop: 10,
                color: encours ? JAUNE : 'rgba(255,255,255,.75)', textShadow: '0 2px 8px rgba(0,0,0,.7)'}}>{i + 1}. {n}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Pastille: React.FC<{x: number; y: number; texte: string; couleur: string; t: number; dx?: number; dy?: number}> =
  ({x, y, texte, couleur, t, dx = 0, dy = -140}) => {
    const {width, height} = useVideoConfig();
    const px = x * width, py = y * height, lx = px + dx, ly = py + dy;
    return (
      <>
        <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, opacity: t}}>
          <line x1={px} y1={py} x2={px + (lx - px) * t} y2={py + (ly - py) * t} stroke={couleur} strokeWidth={5} />
          <circle cx={px} cy={py} r={14 * t} fill="none" stroke={couleur} strokeWidth={6} />
        </svg>
        <div style={{position: 'absolute', left: Math.min(Math.max(lx - 300, 20), width - 620), width: 600, top: ly - 44,
          textAlign: 'center', opacity: t, transform: `scale(${.8 + .2 * t})`}}>
          <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 44, color: '#0B1020', background: couleur,
            padding: '8px 20px', borderRadius: 14, boxShadow: '0 6px 0 rgba(0,0,0,.35)'}}>{texte}</span>
        </div>
      </>
    );
  };

const Tampon: React.FC<{texte: string; couleur: string; t: number; top: number}> = ({texte, couleur, t, top}) => {
  if (t <= 0) return null;
  return (
    <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', opacity: Math.min(t * 3, 1),
      transform: `scale(${1.6 - .6 * Math.min(t, 1)}) rotate(-5deg)`}}>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 92, color: couleur, border: `9px solid ${couleur}`,
        borderRadius: 22, padding: '6px 30px', background: 'rgba(11,16,32,.55)', letterSpacing: 2}}>{texte}</span>
    </div>
  );
};

const Energie: React.FC<{bf: number}> = ({bf}) => {
  const vis = interpolate(bf, [150, 162, 430, 445], [0, 1, 1, 0], cl);
  if (vis <= 0) return null;
  const niveau = bf < 285
    ? interpolate(bf, [160, 270], [1, .08], cl)
    : interpolate(bf, [290, 300], [.08, .85], cl) - interpolate(bf, [300, 430], [0, .12], cl);
  const c = niveau < .3 ? ROUGE : niveau < .6 ? JAUNE : VERT;
  return (
    <div style={{position: 'absolute', right: 50, top: 330, opacity: vis, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 26, color: '#fff', marginBottom: 10, textShadow: '0 2px 8px rgba(0,0,0,.8)'}}>ENERGY</div>
      <div style={{width: 50, height: 380, borderRadius: 25, border: '5px solid #fff', background: 'rgba(0,0,0,.4)', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: `${niveau * 100}%`, background: c}} />
      </div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 36, color: c, marginTop: 10, textShadow: '0 2px 8px rgba(0,0,0,.8)'}}>{Math.round(niveau * 100)}%</div>
    </div>
  );
};

const SousTitre: React.FC<{f: number}> = ({f}) => {
  const st = SOUS_TITRES.find((s) => f >= s.a && f < s.b);
  if (!st) return null;
  const craie = f < DEBUT_3D;
  const t = interpolate(f, [st.a, st.a + 6], [0, 1], cl);
  const net = (m: string) => m.replace(/[^\w']/g, '');
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 290, textAlign: 'center', opacity: t, transform: `scale(${.92 + .08 * t})`}}>
      <span style={{fontFamily: craie ? CRAIE : SANS, fontWeight: craie ? 700 : 900, fontSize: craie ? 86 : 62, lineHeight: 1.15,
        color: CRAIE_C, textShadow: craie ? '0 0 6px rgba(255,255,255,.25)' : '0 4px 0 #000, 0 0 24px rgba(0,0,0,.8)',
        WebkitTextStroke: craie ? undefined : '2px #000'}}>
        {st.t.split(' ').map((m, i) => <span key={i} style={{color: st.fort && net(m) === net(st.fort) ? JAUNE : undefined}}>{m} </span>)}
      </span>
    </div>
  );
};

export const RipLesson: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bf = Math.min(Math.max(f - DEBUT_3D, 0), N3D);

  const tag = spring({frame: f - 4, fps, config: {damping: 12}});
  const titre = interpolate(f, [10, 55], [100, 0], cl);
  const dessin = interpolate(f, [45, 118], [100, 0], cl);
  const fondu = interpolate(f, [128, 168], [1, 0], cl);
  const lueur = interpolate(f, [118, 140, 175], [0, 1, 0], cl);
  const craie = interpolate(f, [150, 185], [1, 0], cl);
  const opa3d = interpolate(f, [132, 168], [0, 1], cl);
  const hud = interpolate(f, [178, 200], [0, 1], cl);

  const question = interpolate(bf, [10, 20, 62, 70], [0, 1, 1, 0], cl);
  const pulse = 1 + .06 * Math.sin(f / 4);
  const ripT = interpolate(bf, [72, 88], [0, 1], cl) * interpolate(bf, [140, 150], [1, 0], cl);
  const vitesse = interpolate(bf, [95, 140], [0, 8], cl);
  const vitVis = interpolate(bf, [92, 100, 142, 150], [0, 1, 1, 0], cl);
  const wrong = interpolate(bf, [215, 222], [0, 1], cl) * interpolate(bf, [266, 272], [1, 0], cl);
  const tire = interpolate(bf, [180, 192], [0, 1], cl) * interpolate(bf, [262, 270], [1, 0], cl);
  const rembob = interpolate(bf, [270, 272, 286, 290], [0, 1, 1, 0], cl);
  const parallele = interpolate(bf, [296, 304], [0, 1], cl) * interpolate(bf, [356, 362], [1, 0], cl);
  const safe = interpolate(bf, [408, 416], [0, 1], cl);
  const fin = interpolate(f, [DEBUT_3D + N3D, DEBUT_3D + N3D + 15], [0, 1], cl);

  const nageur = ancre(bf, 'swimmer'), rip = ancre(bf, 'rip'), calme = ancre(bf, 'calm');
  const src = staticFile(`lesson_rip/3d/f${String(bf).padStart(4, '0')}.jpg`);

  return (
    <AbsoluteFill style={{backgroundColor: '#05080F'}}>
      <AbsoluteFill style={{opacity: opa3d, filter: rembob > 0 ? `saturate(${1 - rembob * .8}) contrast(${1 + rembob * .3})` : undefined}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>

      {fondu > 0 && (
        <AbsoluteFill style={{opacity: fondu}}>
          <Tableau>
            <div style={{position: 'absolute', top: 120, left: 70, transform: `scale(${tag})`, transformOrigin: 'left center',
              fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: 5, color: '#142A22', background: JAUNE,
              padding: '10px 22px', borderRadius: 10}}>LIFE 101 · SURVIVAL</div>
            <div style={{position: 'absolute', top: 200, left: 70, right: 60, fontFamily: CRAIE, fontWeight: 700, fontSize: 116,
              lineHeight: 1.0, color: CRAIE_C, clipPath: `inset(0 ${titre}% 0 0)`, textShadow: '0 0 8px rgba(255,255,255,.25)'}}>
              How to escape a <span style={{color: JAUNE}}>rip current</span>
            </div>
          </Tableau>
        </AbsoluteFill>
      )}
      {craie > 0 && (
        <AbsoluteFill style={{opacity: craie, clipPath: `inset(${dessin}% 0 0 0)`,
          filter: `drop-shadow(0 0 ${4 + lueur * 26}px rgba(255,240,180,${.3 + lueur * .7}))`}}>
          <Img src={staticFile('lesson_rip/craie_plage.png')} style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      )}

      {f >= DEBUT_3D && (
        <>
          {question > 0 && calme && (
            <div style={{position: 'absolute', left: 140, right: 140, top: calme[1] * 1920 - 380, textAlign: 'center',
              opacity: question, transform: `scale(${pulse})`}}>
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 68, color: '#fff', WebkitTextStroke: '3px #0B1020',
                paintOrder: 'stroke fill', textShadow: '0 6px 0 #0B1020', lineHeight: 1.05}}>Where would<br />you swim? 🤔</div>
            </div>
          )}
          {ripT > 0 && rip && <Pastille x={rip[0]} y={rip[1]} texte="⚠️ RIP CURRENT" couleur={CYAN} t={ripT} dy={-120} />}
          {ripT > 0 && calme && <Pastille x={calme[0]} y={calme[1]} texte="No waves ≠ safe" couleur="#fff" t={ripT} dy={160} />}
          {vitVis > 0 && (
            <div style={{position: 'absolute', left: 60, top: 330, opacity: vitVis}}>
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 120, color: CYAN, lineHeight: 1, WebkitTextStroke: '3px #0B1020',
                paintOrder: 'stroke fill', fontVariantNumeric: 'tabular-nums'}}>{vitesse.toFixed(1)}</div>
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 38, color: '#fff', textShadow: '0 3px 8px rgba(0,0,0,.8)'}}>FEET / SECOND</div>
              <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#fff', marginTop: 6, textShadow: '0 3px 8px rgba(0,0,0,.8)'}}>faster than an<br />Olympic swimmer</div>
            </div>
          )}
          {tire > 0 && nageur && <Pastille x={nageur[0]} y={nageur[1]} texte="pulled OUT ↑" couleur={ROUGE} t={tire} dy={170} />}
          <Tampon texte="✗ WRONG" couleur={ROUGE} t={wrong} top={440} />
          {parallele > 0 && nageur && <Pastille x={nageur[0]} y={nageur[1]} texte="→ swim parallel" couleur={VERT} t={parallele} dy={-170} />}
          <Tampon texte="✓ SAFE" couleur={VERT} t={safe} top={440} />
          <Energie bf={bf} />
          <Etapes bf={bf} vis={hud} />
          {rembob > 0 && (
            <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(255,255,255,${rembob * .12})`}}>
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 124, color: '#fff', opacity: rembob, WebkitTextStroke: '5px #0B1020',
                paintOrder: 'stroke fill'}}>⏪ TRY AGAIN</div>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{position: 'absolute', left: 0, right: 0, top: ((f * 37 + k * 640) % 1920), height: 6,
                  background: 'rgba(255,255,255,.5)', opacity: rembob}} />
              ))}
            </AbsoluteFill>
          )}
        </>
      )}

      <SousTitre f={f} />

      {fin > 0 && (
        <AbsoluteFill style={{background: `rgba(10,24,20,${fin * .88})`, alignItems: 'center', justifyContent: 'center'}}>
          <div style={{opacity: fin, transform: `translateY(${(1 - fin) * 40}px)`, width: 900}}>
            <div style={{fontFamily: CRAIE, fontWeight: 700, fontSize: 100, color: CRAIE_C, textAlign: 'center', marginBottom: 30}}>Remember:</div>
            {['Calm gap = rip current', "Don't fight it", 'Swim parallel, then in'].map((l, i) => {
              const ti = interpolate(f, [DEBUT_3D + N3D + 12 + i * 12, DEBUT_3D + N3D + 24 + i * 12], [0, 1], cl);
              return (
                <div key={l} style={{fontFamily: CRAIE, fontWeight: 700, fontSize: 82, color: CRAIE_C, opacity: ti, margin: '10px 0',
                  transform: `translateX(${(1 - ti) * -40}px)`}}><span style={{color: JAUNE}}>{i + 1}.</span> {l}</div>
              );
            })}
            <div style={{marginTop: 60, background: JAUNE, borderRadius: 26, padding: '24px 36px', textAlign: 'center',
              opacity: interpolate(f, [DEBUT_3D + N3D + 60, DEBUT_3D + N3D + 72], [0, 1], cl)}}>
              <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 36, letterSpacing: 4, color: '#142A22'}}>POP QUIZ</div>
              <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#0B1020', lineHeight: 1.1, marginTop: 6}}>
                Why do rips look like the CALMEST spot? 👇</div>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
