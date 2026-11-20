import {loadFont as chargerAnton} from '@remotion/google-fonts/Anton';
import {loadFont as chargerMontserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as chargerMono} from '@remotion/google-fonts/SpaceMono';
import React from 'react';
import {AbsoluteFill, Easing, Freeze, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';

/* Prototype muet (pas de voix off) de la longue Code Ouvert « Ce que la police n'a PAS le droit de te faire ».
   16:9. Accroche CRS → teaser → titre → chapitre 1 (tutoiement, CSI art. R. 434-14 vérifié le 09/11/2026) → passage au chapitre 2.
   Les encadrés « VOIX » montrent la narration prévue, pour juger le rythme avant de payer la voix. */

const anton = chargerAnton('normal', {subsets: ['latin', 'latin-ext']});
const montserrat = chargerMontserrat('normal', {weights: ['700', '900'], subsets: ['latin', 'latin-ext']});
const mono = chargerMono('normal', {weights: ['400', '700'], subsets: ['latin', 'latin-ext']});
const TITRE = anton.fontFamily;
const TEXTE = montserrat.fontFamily;
const MONO = mono.fontFamily;

const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const NUIT = '#10202C';
const JAUNE = '#FFE14D';
const ROUGE = '#E8343F';

// découpage en secondes
const T = {crs: 0, freeze1: 6.7, teaser: 10.2, titre: 14.6, chap: 19.4, tutA: 21.8, freeze2: 27.8, loi: 30.8, verdict: 39.0, tutB: 43.0, ch2: 46.8, fin: 52.5};
export const DUREE_POLICE_PROTO = s(T.fin);

const ease = Easing.out(Easing.cubic);
const pop = (f: number, de: number, cfg = {damping: 12, stiffness: 180}) => (f < de ? 0 : spring({frame: f - de, fps: FPS, config: cfg}));

/* ------------------------------------------------------------------ éléments communs */

const Fond: React.FC = () => (
  <AbsoluteFill style={{background: NUIT}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
      backgroundSize: '60px 60px'}} />
  </AbsoluteFill>
);

/** Clip vertical sur fond flouté (le même clip agrandi), pour remplir le 16:9 sans bandes noires. */
const ClipVertical: React.FC<{src: string; debut?: number; son?: boolean; fige?: number; zoom?: number; gris?: number}> = ({src, debut = 0, son = true, fige, zoom = 1, gris = 0}) => {
  const contenu = (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(40px) brightness(0.45)', transform: 'scale(1.3)'}}>
        <OffthreadVideo src={staticFile(src)} startFrom={s(debut)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{height: 1000, aspectRatio: '9 / 16', borderRadius: 26, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', border: '6px solid rgba(255,255,255,0.9)',
          transform: `scale(${zoom})`, filter: `grayscale(${gris}) contrast(${1 + gris * 0.25})`}}>
          <OffthreadVideo src={staticFile(src)} startFrom={s(debut)} muted={!son} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
  return fige !== undefined ? <Freeze frame={s(fige)}>{contenu}</Freeze> : contenu;
};

/** Clip recadré (tutoiement) dans une carte inclinée à gauche, sur fond flouté. */
const ClipCarte: React.FC<{src: string; debut?: number; son?: boolean; fige?: number; zoom?: number; gris?: number; gauche?: number}> = ({src, debut = 0, son = true, fige, zoom = 1, gris = 0, gauche = 90}) => {
  const contenu = (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(50px) brightness(0.35)', transform: 'scale(1.4)'}}>
        <OffthreadVideo src={staticFile(src)} startFrom={s(debut)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: gauche, top: 120, width: 930, borderRadius: 22, overflow: 'hidden', border: '7px solid #fff', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        transform: `rotate(-2deg) scale(${zoom})`, transformOrigin: '40% 40%', filter: `grayscale(${gris}) contrast(${1 + gris * 0.25})`}}>
        <OffthreadVideo src={staticFile(src)} startFrom={s(debut)} muted={!son} style={{width: '100%', display: 'block'}} />
      </div>
    </AbsoluteFill>
  );
  return fige !== undefined ? <Freeze frame={s(fige)}>{contenu}</Freeze> : contenu;
};

const Credit: React.FC<{texte: string}> = ({texte}) => (
  <div style={{position: 'absolute', left: 40, bottom: 34, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: 'rgba(255,255,255,0.85)',
    background: 'rgba(0,0,0,0.45)', padding: '6px 14px', borderRadius: 6}}>{texte}</div>
);

/** Ce que la voix off dira (prototype muet). */
const Voix: React.FC<{texte: string}> = ({texte}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', right: 40, top: 30, maxWidth: 760, opacity: o, fontFamily: TEXTE, fontWeight: 700, fontSize: 26, color: '#cfd8e0',
      background: 'rgba(0,0,0,0.6)', border: '2px dashed rgba(255,255,255,0.35)', borderRadius: 12, padding: '10px 18px', fontStyle: 'italic'}}>
      <span style={{fontFamily: MONO, fontStyle: 'normal', color: JAUNE, marginRight: 10}}>VOIX</span>{texte}
    </div>
  );
};

/** Sous-titre des paroles réelles du clip. */
const Parole: React.FC<{lignes: [number, number, string][]; haut?: number; droite?: boolean}> = ({lignes, haut = 820, droite = false}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const l = lignes.find(([a, b]) => t >= a && t < b);
  if (!l) return null;
  const e = pop(f, s(l[0]), {damping: 14, stiffness: 260});
  if (droite) {
    return (
      <div style={{position: 'absolute', left: 1110, width: 740, top: 330, transform: `translateX(${(1 - e) * 60}px)`, opacity: Math.min(1, e * 1.4)}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: JAUNE, marginBottom: 14}}>CE QU’ON ENTEND</div>
        <div style={{fontFamily: TEXTE, fontWeight: 900, fontSize: 64, lineHeight: 1.12, color: '#fff', borderLeft: `10px solid ${JAUNE}`, paddingLeft: 28}}>{l[2]}</div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: haut, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${0.85 + 0.15 * e})`, maxWidth: 1300, textAlign: 'center', fontFamily: TEXTE, fontWeight: 900, fontSize: 54, lineHeight: 1.15, color: '#fff',
        background: 'rgba(16,32,44,0.88)', padding: '14px 30px', borderRadius: 16, borderBottom: `6px solid ${JAUNE}`}}>{l[2]}</div>
    </div>
  );
};

const Tampon: React.FC<{texte: string; de?: number; couleur?: string; fond?: string; taille?: number; style?: React.CSSProperties}> = ({texte, de = 0, couleur = ROUGE, fond = 'rgba(255,255,255,0.92)', taille = 120, style}) => {
  const f = useCurrentFrame();
  const e = pop(f, de, {damping: 9, stiffness: 260});
  if (e <= 0.001) return null;
  return (
    <div style={{position: 'absolute', transform: `scale(${2.4 - 1.4 * e}) rotate(-7deg)`, opacity: Math.min(1, e * 1.5), fontFamily: TITRE, fontSize: taille, color: couleur,
      border: `12px solid ${couleur}`, borderRadius: 18, padding: '4px 36px', background: fond, letterSpacing: 2, whiteSpace: 'nowrap', ...style}}>{texte}</div>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 5], [0.85, 0], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#fff', opacity: o}} />;
};

/** Bandeau de chapitre en haut à gauche. */
const Bandeau: React.FC<{texte: string}> = ({texte}) => (
  <div style={{position: 'absolute', left: 40, top: 34, display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONO, fontWeight: 700, fontSize: 24, color: '#fff',
    background: 'rgba(16,32,44,0.85)', padding: '8px 16px', borderRadius: 8, letterSpacing: 2}}>
    <span style={{background: JAUNE, color: NUIT, fontFamily: TITRE, fontSize: 26, padding: '0 10px', borderRadius: 4, letterSpacing: 1}}>§</span>{texte}
  </div>
);

const BANDEAU_CH1 = 'CHAPITRE 1 / 8 · LE TUTOIEMENT';
const CREDIT_TUTO = 'VIDÉO · TIKTOK @ABONNE_185 (ORIGINAL SUPPRIMÉ)';

/* ------------------------------------------------------------------ séquences */

const Accroche: React.FC = () => (
  <AbsoluteFill>
    <ClipCarte src="police/crs.mp4" gauche={495} />
    <Parole haut={800} lignes={[[0.7, 2.7, '« Je vous demande d’arrêter votre provocation. »'], [2.7, 3.7, '« Chacun son métier. »'],
      [3.7, 5.7, '« Je ne peux pas vous laisser passer la provocation. »'], [5.7, 6.8, '« Nous, on fait juste notre travail. »']]} />
    <Credit texte="IMAGES · LIVE @ABONNE_184 · REPRIS PAR QUOTIDIEN" />
  </AbsoluteFill>
);

const Fige1: React.FC = () => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, s(3.5)], [1, 1.12], {easing: ease, extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <ClipCarte src="police/crs.mp4" fige={6.5} zoom={z} gris={1} son={false} gauche={495} />
      <Flash />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}><Tampon texte="IL AVAIT LE DROIT ?" de={4} style={{position: 'relative'}} /></AbsoluteFill>
      <Voix texte="Il avait le droit de l’écarter. Mais pas de l’empêcher de filmer. Et toi, tu sais où est la limite ?" />
    </AbsoluteFill>
  );
};

const TEASER = [
  {src: 'police/tutoie.mp4', debut: 3.4, tag: 'TUTOIEMENT'},
  {src: 'police/facies.mp4', debut: 0, tag: 'CONTRÔLE AU FACIÈS'},
  {src: 'police/fouille.mp4', debut: 0, tag: 'FOUILLE DE LA VOITURE'},
];
const D_TEASER = s(1.45);

const TeaserPlan: React.FC<{src: string; debut: number; tag: string}> = ({src, debut, tag}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, D_TEASER], [1.04, 1.14]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${z})`}}>
        <OffthreadVideo src={staticFile(src)} startFrom={s(debut)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.1) saturate(1.1)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(transparent 45%, rgba(16,32,44,0.9))'}} />
      <Flash />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 150}}>
        <div style={{fontFamily: TITRE, fontSize: 150, color: '#fff', transform: `scale(${0.8 + 0.2 * pop(f, 0)})`, textShadow: '0 10px 0 rgba(0,0,0,0.35)'}}>
          {tag}<span style={{color: JAUNE}}> ?</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Teaser: React.FC = () => (
  <AbsoluteFill>
    {TEASER.map((it, i) => (
      <Sequence key={it.tag} from={i * D_TEASER} durationInFrames={i === TEASER.length - 1 ? s(T.titre - T.teaser) - i * D_TEASER : D_TEASER}>
        <TeaserPlan {...it} />
      </Sequence>
    ))}
    <Voix texte="Tutoiement, contrôle au faciès, fouille de la voiture…" />
  </AbsoluteFill>
);

const Titre: React.FC = () => {
  const f = useCurrentFrame();
  const livres = [
    {nom: 'CODE PÉNAL', c: '#7a1f28'},
    {nom: 'CODE DE PROCÉDURE PÉNALE', c: '#1f3f7a'},
    {nom: 'CODE DE LA SÉCURITÉ INTÉRIEURE', c: '#2b6b4a'},
  ];
  return (
    <AbsoluteFill>
      <Fond />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 110}}>
        <div style={{fontFamily: TITRE, fontSize: 104, lineHeight: 1.08, color: '#fff', textAlign: 'center', transform: `translateY(${(1 - pop(f, 0)) * 60}px)`, opacity: pop(f, 0)}}>
          CE QUE LA POLICE N’A <span style={{background: JAUNE, color: NUIT, padding: '0 18px', borderRadius: 8}}>PAS</span><br />LE DROIT DE TE FAIRE
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
        {livres.map((l, k) => {
          const e = pop(f, s(0.6 + k * 0.35), {damping: 11, stiffness: 160});
          return (
            <div key={l.nom} style={{width: 900 - k * 40, height: 74, background: l.c, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TITRE, fontSize: 40, color: '#f5e6c8', letterSpacing: 3, boxShadow: '0 10px 0 rgba(0,0,0,0.35)', borderLeft: '18px solid rgba(0,0,0,0.25)',
              transform: `translateY(${(1 - e) * -500}px) rotate(${(k - 1) * 1.5}deg)`, opacity: Math.min(1, e * 2)}}>{l.nom}</div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', justifyContent: 'center'}}>
        <Tampon texte="J’AI LU TOUS LES TEXTES" de={s(2.0)} couleur={NUIT} fond={JAUNE} taille={70} style={{position: 'relative'}} />
      </div>
      <Voix texte="J’ai lu tous les textes. Voilà ce que la police n’a pas le droit de te faire." />
    </AbsoluteFill>
  );
};

const Chapitre: React.FC<{n: string; titre: string}> = ({n, titre}) => {
  const f = useCurrentFrame();
  const balayage = interpolate(f, [0, 10], [-1920, 0], {easing: ease, extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Fond />
      <AbsoluteFill style={{background: JAUNE, transform: `translateX(${balayage}px)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 60}}>
        <div style={{fontFamily: TITRE, fontSize: 380, color: NUIT, lineHeight: 1, transform: `scale(${pop(f, 4)})`}}>{n}</div>
        <div style={{fontFamily: TITRE, fontSize: 96, color: NUIT, lineHeight: 1.05, maxWidth: 1000, opacity: pop(f, 10)}}>{titre}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TutoiementA: React.FC = () => (
  <AbsoluteFill>
    <ClipCarte src="police/tutoie.mp4" />
    <Parole droite lignes={[[0, 3.1, '« Dans le code pénal, il y a une loi qui interdit de te tutoyer ? »'], [3.1, 6.1, '« Il y a une loi ? Il n’y a pas de loi. Je te tutoie, OK ? »']]} />
    <Bandeau texte={BANDEAU_CH1} />
    <Credit texte={CREDIT_TUTO} />
    <Voix texte="Premier cas. Un contrôle, un policier qui tutoie. Et quand on lui fait la remarque…" />
  </AbsoluteFill>
);

const Fige2: React.FC = () => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, s(3)], [1, 1.12], {easing: ease, extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <ClipCarte src="police/tutoie.mp4" fige={4.7} zoom={z} gris={1} son={false} />
      <Flash />
      <Tampon texte="« IL N’Y A PAS DE LOI » ?" de={4} taille={96} style={{left: 820, top: 640}} />
      <Bandeau texte={BANDEAU_CH1} />
      <Voix texte="Le policier est sûr de lui : il n’y a pas de loi." />
    </AbsoluteFill>
  );
};

const Loi: React.FC = () => {
  const f = useCurrentFrame();
  const texte = 'Le policier ou le gendarme est au service de la population. Sa relation avec celle-ci est empreinte de courtoisie et ';
  const fort = 'requiert l’usage du vouvoiement.';
  const n = Math.floor(interpolate(f, [s(1.6), s(4.2)], [0, texte.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const nFort = Math.floor(interpolate(f, [s(4.2), s(5.2)], [0, fort.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const surl = interpolate(f, [s(5.3), s(6.0)], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const barre = interpolate(f, [s(0.5), s(0.9)], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Fond />
      <div style={{position: 'absolute', left: 90, top: 260, display: 'flex', flexDirection: 'column', gap: 34}}>
        <div style={{position: 'relative', fontFamily: TITRE, fontSize: 64, color: '#8a96a3', opacity: pop(f, 0)}}>
          CODE PÉNAL
          <div style={{position: 'absolute', left: -10, top: '52%', height: 9, width: `${barre * 1.05}%`, background: ROUGE, borderRadius: 4}} />
        </div>
        <div style={{fontFamily: TITRE, fontSize: 64, lineHeight: 1.1, color: '#fff', opacity: pop(f, s(1.0)), transform: `translateX(${(1 - pop(f, s(1.0))) * -80}px)`}}>
          CODE DE DÉONTOLOGIE<br /><span style={{color: JAUNE}}>DE LA POLICE ✓</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 820, top: 190, width: 1000, background: '#f6f0e1', borderRadius: 14, padding: '40px 50px', boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
        transform: `rotate(1deg) translateY(${(1 - pop(f, s(1.2))) * 700}px)`}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: '#a0302f'}}>CODE DE LA SÉCURITÉ INTÉRIEURE · ART. R. 434-14</div>
        <div style={{fontFamily: MONO, fontSize: 22, color: '#7a6f5a', marginTop: 6}}>en vigueur depuis le 1er janvier 2014</div>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 44, lineHeight: 1.4, color: '#1b1d24', marginTop: 26, minHeight: 370}}>
          {texte.slice(0, n)}
          <span style={{fontWeight: 700, backgroundImage: `linear-gradient(${JAUNE}, ${JAUNE})`, backgroundRepeat: 'no-repeat', backgroundSize: `${surl}% 100%`}}>{fort.slice(0, nFort)}</span>
        </div>
      </div>
      <Bandeau texte={BANDEAU_CH1} />
      <Voix texte="Dans le code pénal, non. Mais dans le code de déontologie de la police, si : le vouvoiement est obligatoire." />
    </AbsoluteFill>
  );
};

const Verdict: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ClipCarte src="police/tutoie.mp4" fige={4.7} zoom={1.12} gris={1} son={false} gauche={60} />
      <AbsoluteFill style={{background: 'rgba(16,32,44,0.45)'}} />
      <Tampon texte="FAUX" de={3} taille={240} style={{left: 1200, top: 190}} />
      <div style={{position: 'absolute', left: 1100, top: 560, width: 760, fontFamily: TITRE, fontSize: 76, lineHeight: 1.1, color: '#fff', opacity: pop(f, s(0.8)),
        transform: `translateY(${(1 - pop(f, s(0.8))) * 40}px)`}}>
        LE VOUVOIEMENT<br />EST <span style={{color: JAUNE}}>OBLIGATOIRE</span>
      </div>
      <Bandeau texte={BANDEAU_CH1} />
      <Voix texte="Donc « il n’y a pas de loi » : faux. Le vouvoiement est obligatoire depuis 2014." />
    </AbsoluteFill>
  );
};

const TutoiementB: React.FC = () => (
  <AbsoluteFill>
    <ClipCarte src="police/tutoie.mp4" debut={6.0} />
    <Parole droite lignes={[[0, 1.9, '« Je ne suis pas ton ami, moi. »'], [1.9, 3.9, '« Et puisque ce n’est pas un contrôle, je m’en vais. »']]} />
    <Bandeau texte={BANDEAU_CH1} />
    <Credit texte={CREDIT_TUTO} />
  </AbsoluteFill>
);

const VersChapitre2: React.FC = () => {
  const f = useCurrentFrame();
  const glisse = interpolate(f, [s(2.4), s(2.9)], [1920, 0], {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <ClipCarte src="police/tutoie.mp4" fige={9.6} zoom={1.08} gris={1} son={false} />
      <Flash />
      <Tampon texte="« JE M’EN VAIS » ?" de={3} taille={110} style={{left: 900, top: 420}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 130, height: 200, background: JAUNE, transform: `translateX(${glisse}px)`, display: 'flex', alignItems: 'center',
        padding: '0 70px', gap: 40, boxShadow: '0 -10px 40px rgba(0,0,0,0.4)'}}>
        <div style={{fontFamily: TITRE, fontSize: 150, color: NUIT}}>2</div>
        <div style={{fontFamily: TITRE, fontSize: 76, color: NUIT, lineHeight: 1}}>LE CONTRÔLE D’IDENTITÉ<br /><span style={{fontSize: 42, fontFamily: MONO, fontWeight: 700}}>tu peux vraiment partir ?</span></div>
      </div>
      <Voix texte="Par contre, « je m’en vais »… ça, c’est une autre histoire." />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ composition */

const seg = (de: number, a: number, el: React.ReactNode) => <Sequence from={s(de)} durationInFrames={s(a) - s(de)}>{el}</Sequence>;

export const PoliceProto: React.FC = () => (
  <AbsoluteFill style={{background: NUIT}}>
    {seg(T.crs, T.freeze1, <Accroche />)}
    {seg(T.freeze1, T.teaser, <Fige1 />)}
    {seg(T.teaser, T.titre, <Teaser />)}
    {seg(T.titre, T.chap, <Titre />)}
    {seg(T.chap, T.tutA, <Chapitre n="1" titre="« JE TE TUTOIE, OK ? »" />)}
    {seg(T.tutA, T.freeze2, <TutoiementA />)}
    {seg(T.freeze2, T.loi, <Fige2 />)}
    {seg(T.loi, T.verdict, <Loi />)}
    {seg(T.verdict, T.tutB, <Verdict />)}
    {seg(T.tutB, T.ch2, <TutoiementB />)}
    {seg(T.ch2, T.fin, <VersChapitre2 />)}
  </AbsoluteFill>
);
