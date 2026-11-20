import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import ch0 from './ch0_voix.json';
import ch1a from './ch1a_voix.json';
import ch1b from './ch1b_voix.json';
import ch1c from './ch1c_voix.json';
import ch2a from './ch2a_voix.json';
import ch2b from './ch2b_voix.json';
import ch3a from './ch3a_voix.json';
import ch3b from './ch3b_voix.json';
import ch4a from './ch4a_voix.json';
import ch4b from './ch4b_voix.json';
import ch5 from './ch5_voix.json';
import ch6 from './ch6_voix.json';
import ch7 from './ch7_voix.json';
import ch8 from './ch8_voix.json';
import {
  Bandeau, BoutonAbo, Bulles, CarteChapitre, Chiffre, ClipCarte, Credit, Doc, Duel, Flash, Fond, Gros, JAUNE, Liste, MONO, NUIT, Parole, Pastille, ROUGE, TEXTE, TITRE, Tampon, VERT,
  ease, pop, s,
} from './policeKit';

/* Longue Code Ouvert « Ce que la police n'a PAS le droit de te faire (j'ai lu tous les textes) », 16:9.
   Lois vérifiées : Légifrance 09/11/2026 (CSI R.434-14/15/16, CPP 78-1/78-2/78-2-2/78-2-3/78-3, CP 434-15-2),
   texte de la loi 2026-798 (AIDA, art. L. 233-1 code de la route), service-public.fr (garde à vue), Cour de cassation ass. plén. 7/11/2022.
   Voir code-ouvert/longues/police-droits/PLAN.md. Pas de sous-titres incrustés sur la voix (règle des longues : .srt séparé). */

type Voix = {duree: number; mots: {t: string; a: number; b: number}[]};
type Ligne = [number, number, string];

/* ------------------------------------------------------------------ extraits réels (≤ 8 s chacun, son d'origine) */

const CLIPS: Record<string, {src: string; debut: number; duree: number; credit: string; lignes: Ligne[]}> = {
  crs: {src: 'police/crs.mp4', debut: 0, duree: 6.7, credit: 'IMAGES · LIVE @ABONNE_184 · REPRIS PAR QUOTIDIEN',
    lignes: [[0.7, 2.7, '« Je vous demande d’arrêter votre provocation. »'], [2.7, 3.7, '« Chacun son métier. »'],
      [3.7, 5.7, '« Je ne peux pas vous laisser passer la provocation. »'], [5.7, 6.8, '« Nous, on fait juste notre travail. »']]},
  tutoA: {src: 'police/tutoie.mp4', debut: 0, duree: 6.1, credit: 'VIDÉO · TIKTOK @ABONNE_185 (ORIGINAL SUPPRIMÉ)',
    lignes: [[0, 3.1, '« Dans le code pénal, il y a une loi qui interdit de te tutoyer ? »'], [3.1, 6.1, '« Il y a une loi ? Il n’y a pas de loi. Je te tutoie, OK ? »']]},
  tutoB: {src: 'police/tutoie.mp4', debut: 6.0, duree: 3.8, credit: 'VIDÉO · TIKTOK @ABONNE_185 (ORIGINAL SUPPRIMÉ)',
    lignes: [[0, 1.9, '« Je ne suis pas ton ami, moi. »'], [1.9, 3.9, '« Et puisque ce n’est pas un contrôle, je m’en vais. »']]},
  facies: {src: 'police/facies_long.mp4', debut: 0, duree: 10.0, credit: 'VIDÉO · VIA TIKTOK @ABONNE_186',
    lignes: [[0, 4.9, '« Lâchez-moi… C’est toujours les mêmes que vous contrôlez. »'], [4.9, 10.1, '« Assumez-le, assumez-le ! »']]},
  fouille: {src: 'police/fouille_long.mp4', debut: 0, duree: 11.0, credit: 'VIDÉO · VIA TIKTOK @ABONNE_187',
    lignes: [[0, 4.7, '« T’as pas le droit de fouiller, frérot. »'], [4.7, 5.7, '« C’est quoi le joint, là ? »'], [5.7, 6.7, '« Quel joint ? »'],
      [6.7, 8.7, '« T’as pas le droit de fouiller ! »'], [8.7, 11.1, '« Donne-moi le joint, là. C’est quoi le joint ? »']]},
  lycee: {src: 'police/lycee.mp4', debut: 0, duree: 6.0, credit: 'VIDÉO · TÉMOIN, VIA TIKTOK @ABONNE_188',
    lignes: [[0.1, 3.4, '« Oh, j’ai la vidéo ! J’ai la vidéo ! »'], [3.4, 6.1, '« Il a juste demandé s’il peut passer ! »']]},
};
type Clip = keyof typeof CLIPS;

/* ------------------------------------------------------------------ ancrage des visuels sur les mots */

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[«»:,.?!…;"]/g, '').replace(/’/g, "'");

/** Instants (en s) des mots-clés, cherchés dans l'ordre (chaque recherche repart après la précédente). null = début du bloc. */
const ancres = (v: Voix, cles: (string | null)[]) => {
  let curseur = 0;
  return cles.map((c) => {
    if (c === null) return 0;
    const n = norm(c);
    for (let i = curseur; i < v.mots.length; i++) {
      if (norm(v.mots[i].t).includes(n)) { curseur = i + 1; return Math.max(0, v.mots[i].a - 0.1); }
    }
    throw new Error(`mot introuvable : « ${c} »`);
  });
};

type Temps = [string | null, React.ReactNode];
/** Bloc de voix : l'audio + une suite de visuels, chacun visible jusqu'au suivant. */
const BlocVoix: React.FC<{v: Voix; fichier: string; temps: Temps[]; bandeau?: string}> = ({v, fichier, temps, bandeau}) => {
  const t = ancres(v, temps.map((x) => x[0]));
  const fin = v.duree + 0.5;
  return (
    <AbsoluteFill>
      {temps.map(([, el], i) => {
        const de = s(t[i]);
        const a = s(i + 1 < t.length ? t[i + 1] : fin);
        return <Sequence key={i} from={de} durationInFrames={Math.max(1, a - de)}>{el}</Sequence>;
      })}
      {bandeau && <Bandeau texte={bandeau} />}
      <Audio src={staticFile(`police/${fichier}_voix.wav`)} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ plans réutilisables */

const PlanClip: React.FC<{c: Clip; bandeau?: string; centre?: boolean}> = ({c, bandeau, centre = false}) => {
  const k = CLIPS[c];
  return (
    <AbsoluteFill>
      <ClipCarte src={k.src} debut={k.debut} gauche={centre ? 495 : 90} />
      <Parole lignes={k.lignes} droite={!centre} haut={800} />
      {bandeau && <Bandeau texte={bandeau} />}
      <Credit texte={k.credit} />
    </AbsoluteFill>
  );
};

/** Arrêt sur image en noir et blanc + tampon. a = instant figé, en s depuis le début de l'extrait.
 *  L'image vient d'un JPEG extrait par ffmpeg (public/police/fige_<clip>_<t>.jpg) : <Freeze> imbriqué dans les blocs ne chargeait pas la vidéo. */
const Fige: React.FC<{c: Clip; a: number; tampon: string; taille?: number; centre?: boolean}> = ({c, a, tampon, taille = 100, centre = false}) => {
  const f = useCurrentFrame();
  const k = CLIPS[c];
  const z = interpolate(f, [0, s(3)], [1, 1.1], {easing: ease, extrapolateRight: 'clamp'});
  const image = staticFile(`police/fige_${k.src.split('/')[1].replace('.mp4', '')}_${String(Math.round((k.debut + a) * 10) / 10)}.jpg`);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(50px) brightness(0.3) grayscale(1)', transform: 'scale(1.4)'}}><Img src={image} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></AbsoluteFill>
      <div style={{position: 'absolute', left: centre ? 495 : 90, top: 120, width: 930, borderRadius: 22, overflow: 'hidden', border: '7px solid #fff', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        transform: `rotate(-2deg) scale(${z})`, transformOrigin: '40% 40%', filter: 'grayscale(1) contrast(1.25)'}}>
        <Img src={image} style={{width: '100%', display: 'block'}} />
      </div>
      <Flash />
      <Tampon texte={tampon} de={4} taille={taille} style={centre ? {left: 560, top: 430} : {left: 860, top: 600}} />
    </AbsoluteFill>
  );
};

/** Clip flouté en fond + gros titre (introduction d'un cas). */
const Intro: React.FC<{c: Clip; titre: string; petit?: string}> = ({c, titre, petit}) => {
  const k = CLIPS[c];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(30px) brightness(0.35)', transform: 'scale(1.3)'}}>
        <OffthreadVideo src={staticFile(k.src)} startFrom={s(k.debut)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Gros texte={titre} petit={petit} taille={110} />
    </AbsoluteFill>
  );
};

const SurFond: React.FC<{children: React.ReactNode; teinte?: string}> = ({children, teinte}) => (
  <AbsoluteFill><Fond teinte={teinte} />{children}</AbsoluteFill>
);

/* ------------------------------------------------------------------ reconstitutions (chapitres sans vraie vidéo) */

/** Téléphone verrouillé : des points de code qui se remplissent. */
const Telephone: React.FC<{titre?: string}> = ({titre}) => {
  const f = useCurrentFrame();
  const n = Math.min(4, Math.floor(f / 9));
  return (
    <SurFond teinte="rgba(60,90,200,0.35)">
      <div style={{position: 'absolute', left: 300, top: 110, width: 430, height: 860, borderRadius: 64, background: '#0b0f14', border: '14px solid #2a313b',
        boxShadow: '0 40px 90px rgba(0,0,0,0.6)', transform: `translateY(${(1 - pop(f, 0)) * 300}px)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontFamily: TEXTE, fontWeight: 700, fontSize: 96, color: '#fff'}}>21:47</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: MONO, fontSize: 28, color: '#9aa4ae'}}>Saisir le code</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', gap: 26}}>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{width: 30, height: 30, borderRadius: 15, border: '3px solid #fff', background: i < n ? '#fff' : 'transparent'}} />)}
        </div>
        <div style={{position: 'absolute', left: 60, right: 60, top: 460, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22}}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].map((c, i) => (
            <div key={i} style={{height: 70, borderRadius: 35, background: c ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#fff', fontFamily: TEXTE, fontWeight: 700, fontSize: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{c}</div>
          ))}
        </div>
      </div>
      {titre && <div style={{position: 'absolute', left: 860, right: 120, top: 380, fontFamily: TITRE, fontSize: 96, lineHeight: 1.05, color: '#fff', whiteSpace: 'pre-line', opacity: pop(f, 6)}}>{titre}</div>}
    </SurFond>
  );
};

/** Horloge de garde à vue. */
const Horloge: React.FC<{max: number; legende: string}> = ({max, legende}) => {
  const f = useCurrentFrame();
  const h = Math.round(interpolate(f, [4, 40], [0, max], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}));
  const tour = interpolate(f, [4, 40], [0, 360 * (max / 24)], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return (
    <SurFond teinte="rgba(200,60,60,0.25)">
      <div style={{position: 'absolute', left: 260, top: 200, width: 640, height: 640, borderRadius: 320, border: '18px solid #fff', background: 'rgba(255,255,255,0.05)'}}>
        <div style={{position: 'absolute', left: 291, top: 50, width: 22, height: 252, background: JAUNE, borderRadius: 11, transformOrigin: '11px 252px', transform: `rotate(${tour}deg)`}} />
        <div style={{position: 'absolute', left: 271, top: 271, width: 62, height: 62, borderRadius: 31, background: '#fff'}} />
      </div>
      <div style={{position: 'absolute', left: 1020, top: 330, fontFamily: TITRE, fontSize: 250, lineHeight: 1, color: JAUNE}}>{h} H</div>
      <div style={{position: 'absolute', left: 1030, top: 630, fontFamily: MONO, fontWeight: 700, fontSize: 38, letterSpacing: 3, color: '#fff', maxWidth: 780}}>{legende}</div>
    </SurFond>
  );
};

/** Route : une voiture qui passe devant un policier qui fait signe de s'arrêter. */
const Route: React.FC<{texte?: string}> = ({texte}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 80], [-500, 2100]);
  return (
    <SurFond>
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, height: 300, background: '#2a2f36'}} />
      {Array.from({length: 13}).map((_, i) => <div key={i} style={{position: 'absolute', top: 700, left: i * 180 - (f * 12) % 180, width: 100, height: 14, background: '#fff', opacity: 0.8}} />)}
      <div style={{position: 'absolute', left: 1400, top: 330}}>
        <div style={{width: 90, height: 90, borderRadius: 45, background: '#e9b27d', marginLeft: 20}} />
        <div style={{width: 130, height: 200, background: '#1f3f7a', borderRadius: 24, marginTop: 8}} />
        <div style={{position: 'absolute', left: 120, top: 70, width: 26, height: 150, background: '#1f3f7a', borderRadius: 13, transform: 'rotate(-35deg)'}} />
        <div style={{position: 'absolute', left: 150, top: 0, width: 70, height: 70, borderRadius: 35, background: '#fff', border: `10px solid ${ROUGE}`}} />
      </div>
      <div style={{position: 'absolute', left: x, top: 590}}>
        <div style={{width: 420, height: 120, background: ROUGE, borderRadius: 30}} />
        <div style={{position: 'absolute', left: 90, top: -70, width: 230, height: 90, background: '#c42b35', borderRadius: '40px 40px 0 0'}} />
        {[60, 300].map((l) => <div key={l} style={{position: 'absolute', left: l, top: 90, width: 70, height: 70, borderRadius: 35, background: '#111', border: '10px solid #555'}} />)}
      </div>
      {texte && <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: TITRE, fontSize: 110, color: '#fff'}}>{texte}</div>}
    </SurFond>
  );
};

/** Caméra de lecture de plaques qui scanne. */
const Lapi: React.FC = () => {
  const f = useCurrentFrame();
  const y = interpolate(f % 40, [0, 40], [0, 160]);
  return (
    <SurFond teinte="rgba(60,200,140,0.2)">
      <div style={{position: 'absolute', left: 560, top: 300, width: 800, height: 220, background: '#fff', borderRadius: 18, border: '10px solid #1b1d24', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 104, color: '#1b1d24', letterSpacing: 6, overflow: 'hidden', whiteSpace: 'nowrap', paddingLeft: 60}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 70, background: '#2b4fb3'}} />
        AB-123-CD
        <div style={{position: 'absolute', left: 0, right: 0, top: y, height: 8, background: VERT, boxShadow: `0 0 30px ${VERT}`}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', fontFamily: TITRE, fontSize: 90, color: '#fff', opacity: pop(f, 6)}}>
        LECTURE AUTOMATIQUE <span style={{color: JAUNE}}>DES PLAQUES</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 720, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 34, color: '#cfd8e0', opacity: pop(f, 12)}}>
        loi du 18 août 2026 · aussi pour les refus d’obtempérer
      </div>
    </SurFond>
  );
};

/* ------------------------------------------------------------------ chapitres */

const B1 = 'CHAPITRE 1 / 7 · LE TUTOIEMENT';
const B2 = 'CHAPITRE 2 / 7 · LE CONTRÔLE D’IDENTITÉ';
const B3 = 'CHAPITRE 3 / 7 · LA FOUILLE';
const B4 = 'CHAPITRE 4 / 7 · FILMER LA POLICE';
const B5 = 'CHAPITRE 5 / 7 · LE CODE DU TÉLÉPHONE';
const B6 = 'CHAPITRE 6 / 7 · LA GARDE À VUE';
const B7 = 'CHAPITRE 7 / 7 · LE REFUS D’OBTEMPÉRER';

const DOC_R434_16 = 'Lorsque la loi l’autorise à procéder à un contrôle d’identité, le policier ou le gendarme [[ne se fonde sur aucune caractéristique physique]] ou aucun signe distinctif pour déterminer les personnes à contrôler, sauf s’il dispose d’un signalement précis motivant le contrôle.';

const Ch0: React.FC = () => (
  <BlocVoix v={ch0} fichier="ch0" temps={[
    [null, <Fige c="crs" a={6.5} tampon="IL AVAIT LE DROIT ?" centre taille={120} />],
    ['tutoiement', <Intro c="tutoA" titre="TUTOIEMENT *?*" />],
    ['faciès', <Intro c="facies" titre="CONTRÔLE AU FACIÈS *?*" />],
    ['fouille', <Intro c="fouille" titre="FOUILLE DE LA VOITURE *?*" />],
    ['code', <Telephone titre="CODE DU TÉLÉPHONE ?" />],
    ['sous', <SurFond><Bulles textes={['il a pas le droit de te tutoyer', 't’es obligé de donner ton code', 'ils fouillent quand ils veulent', 'filmer la police c’est interdit']} /></SurFond>],
    ['simple', <SurFond><Gros texte={'J’AI LU *TOUS*\nLES TEXTES'} taille={150} /></SurFond>],
    ['pénal', <SurFond><Liste items={[{t: 'Le code pénal'}, {t: 'Le code de procédure pénale'}, {t: 'Le code de déontologie de la police'}]} pas={1.3} haut={260} taille={70} /></SurFond>],
    ['sept', <SurFond><Gros texte={'*7* SITUATIONS\n*7* VRAIES HISTOIRES'} taille={140} /></SurFond>],
    ['question', <SurFond><Tampon texte="IL AVAIT LE DROIT ?" taille={130} style={{left: 520, top: 420}} /></SurFond>],
    ['avant', <SurFond><Duel titreA="POUR LA POLICE" a="✕" titreB="CONTRE LA POLICE" b="✕" coulB={ROUGE} /><Pastille texte="ON LIT LES TEXTES. C’EST TOUT." de={s(3)} style={{left: 520, top: 800}} /></SurFond>],
  ]} />
);

const Ch1A: React.FC = () => (
  <BlocVoix v={ch1a} fichier="ch1a" bandeau={B1} temps={[[null, <Intro c="tutoA" titre={'UN CONTRÔLE.\nUN *TUTOIEMENT*.'} petit="CAS N° 1" />]]} />
);
const Ch1B: React.FC = () => (
  <BlocVoix v={ch1b} fichier="ch1b" bandeau={B1} temps={[
    [null, <Fige c="tutoA" a={4.7} tampon="« IL N’Y A PAS DE LOI » ?" taille={92} />],
    ['vérifions', <SurFond><Duel titreA="CODE PÉNAL" a={'rien sur\nle tutoiement'} titreB="UN AUTRE TEXTE" b={'le code de\ndéontologie'} coulA="#8a96a3" coulB={JAUNE} /></SurFond>],
    ['applique', <SurFond><Gros petit="EN VIGUEUR DEPUIS LE" texte={'1er JANVIER *2014*'} taille={150} /></SurFond>],
    ['décret', <SurFond><Gros petit="CRÉÉ PAR LE DÉCRET N° 2013-1113" texte={'PRESQUE PERSONNE\nNE L’A *LU*'} taille={130} /></SurFond>],
    ['article', <SurFond><Doc reference="CODE DE LA SÉCURITÉ INTÉRIEURE · ART. R. 434-14" date="en vigueur depuis le 1er janvier 2014"
      texte="Le policier ou le gendarme est au service de la population. Sa relation avec celle-ci est empreinte de courtoisie et [[requiert l’usage du vouvoiement.]]" duree={7} /></SurFond>],
    ['donc', <AbsoluteFill><Fige c="tutoA" a={4.7} tampon="FAUX" taille={200} /><div style={{position: 'absolute', left: 1080, top: 820, fontFamily: TITRE, fontSize: 64, color: '#fff'}}>LE VOUVOIEMENT EST <span style={{color: JAUNE}}>OBLIGATOIRE</span></div></AbsoluteFill>],
    ['attention', <SurFond><Liste titre="UN TUTOIEMENT, C’EST…" items={[{t: 'Un manquement à la déontologie', ok: false}, {t: 'À signaler (ex. : Défenseur des droits)'}, {t: 'Pas un droit de partir', ok: false}]} pas={1.8} haut={240} /></SurFond>],
  ]} />
);
const Ch1C: React.FC = () => (
  <BlocVoix v={ch1c} fichier="ch1c" bandeau={B1} temps={[
    [null, <Fige c="tutoB" a={3.6} tampon="« JE M’EN VAIS » ?" taille={104} />],
    ['reste', <SurFond><Gros texte={'ENCORE *6* CAS\nLE PLUS SURPRENANT ARRIVE'} taille={110} /></SurFond>],
    ['abonne', <SurFond><Gros texte="NE RATE PAS LA SUITE" taille={110} /><BoutonAbo de={4} /></SurFond>],
  ]} />
);

const Ch2A: React.FC = () => (
  <BlocVoix v={ch2a} fichier="ch2a" bandeau={B2} temps={[[null, <AbsoluteFill><Intro c="facies" titre={'LE CONTRÔLE\nD’*IDENTITÉ*'} petit="CAS N° 2" /><Pastille texte="1,6 MILLION DE VUES" de={s(2.5)} style={{left: 700, top: 760}} /></AbsoluteFill>]]} />
);
const Ch2B: React.FC = () => (
  <BlocVoix v={ch2b} fichier="ch2b" bandeau={B2} temps={[
    [null, <SurFond><Duel titreA="QUESTION 1" a={'Je peux refuser\nle contrôle ?'} titreB="QUESTION 2" b={'Ils contrôlent\nqui ils veulent ?'} coulA={JAUNE} coulB={JAUNE} /></SurFond>],
    ['première', <SurFond><Doc reference="CODE DE PROCÉDURE PÉNALE · ART. 78-1" date="version en vigueur au 9 novembre 2026"
      texte="Toute personne se trouvant sur le territoire national [[doit accepter de se prêter à un contrôle d’identité]] effectué dans les conditions et par les autorités de police visées aux articles suivants." duree={4} /></SurFond>],
    ['donc', <SurFond><Tampon texte="« JE M’EN VAIS » : NON" taille={110} style={{left: 420, top: 420}} /></SurFond>],
    ['mais', <SurFond><Liste titre="IL FAUT, AU CHOIX…" items={[{t: 'Une raison plausible de soupçonner (infraction…)', ok: true}, {t: 'Ou une réquisition écrite du procureur (lieu + durée)', ok: true}]} pas={2.4} haut={280} /></SurFond>],
    ['déontologie', <SurFond><Doc reference="CODE DE LA SÉCURITÉ INTÉRIEURE · ART. R. 434-16" texte={DOC_R434_16} duree={4.5} taille={38} /></SurFond>],
    ['autrement', <SurFond><Gros texte={'LE CONTRÔLE AU FACIÈS\nEST *INTERDIT*'} taille={130} /><Pastille texte="NOIR SUR BLANC" de={s(1.8)} fond={ROUGE} couleur="#fff" style={{left: 760, top: 760}} /></SurFond>],
    ['même', <SurFond><Liste titre="LE MÊME TEXTE EXIGE AUSSI" items={[{t: 'Le respect de la dignité de la personne', ok: true}, {t: 'Le numéro d’identification visible : le RIO', ok: true}]} pas={2.6} haut={280} /></SurFond>],
    ['papiers', <SurFond><Doc reference="CODE DE PROCÉDURE PÉNALE · ART. 78-2" texte="Les officiers de police judiciaire […] peuvent inviter à [[justifier, par tout moyen, de son identité]] toute personne à l’égard de laquelle existe une ou plusieurs raisons plausibles de soupçonner […]" duree={4} /></SurFond>],
    ['retenu', <SurFond><Chiffre valeur="4 H" legende="MAXIMUM DE VÉRIFICATION · ART. 78-3" /></SurFond>],
    ['surprenant', <SurFond><Gros texte={'ET S’ILS VEULENT\n*FOUILLER* TA VOITURE ?'} taille={120} /></SurFond>],
  ]} />
);

const Ch3A: React.FC = () => (
  <BlocVoix v={ch3a} fichier="ch3a" bandeau={B3} temps={[[null, <Intro c="fouille" titre={'UNE VOITURE.\nUN POLICIER QUI VEUT *FOUILLER*.'} petit="CAS N° 3" />]]} />
);
const Ch3B: React.FC = () => (
  <BlocVoix v={ch3b} fichier="ch3b" bandeau={B3} temps={[
    [null, <Fige c="fouille" a={6} tampon="IL A RAISON ?" taille={110} />],
    ['contrôle', <SurFond><Duel titreA="CONTRÔLE D’IDENTITÉ" a={'montrer\nqui tu es'} titreB="FOUILLE DU VÉHICULE" b={'il faut\nautre chose'} coulA={JAUNE} coulB={ROUGE} /></SurFond>],
    ['soit', <SurFond><Doc reference="CODE DE PROCÉDURE PÉNALE · ART. 78-2-3" texte="[…] peuvent procéder à la visite des véhicules […] lorsqu’il existe à l’égard du conducteur ou d’un passager une ou plusieurs [[raisons plausibles de soupçonner qu’il a commis […] un crime ou un délit flagrant]] […]" duree={4.5} taille={38} /></SurFond>],
    ['réquisition', <SurFond><Doc reference="CODE DE PROCÉDURE PÉNALE · ART. 78-2-2" date="modifié par la loi du 18 août 2026" texte="Sur [[réquisitions écrites du procureur de la République]], dans les lieux et pour la période de temps que ce magistrat détermine et qui [[ne peut excéder vingt-quatre heures]], renouvelables […]" duree={4} taille={38} /></SurFond>],
    ['joint', <SurFond><Liste items={[{t: 'Un indice de délit en cours → visite possible', ok: true}, {t: 'Sans indice ni réquisition → non', ok: false}, {t: 'Le coffre : mêmes règles'}]} pas={2.4} haut={280} /></SurFond>],
    ['palpation', <SurFond><Doc reference="CODE DE LA SÉCURITÉ INTÉRIEURE · ART. R. 434-16" texte="La palpation de sécurité est exclusivement une mesure de sûreté. [[Elle ne revêt pas un caractère systématique.]] […] Chaque fois que les circonstances le permettent, la palpation de sécurité est pratiquée [[à l’abri du regard du public.]]" duree={5} taille={38} /></SurFond>],
    ['garde', <SurFond><Gros texte={'ET SI C’EST *TOI*\nQUI FILMES ?'} taille={130} /></SurFond>],
  ]} />
);

const Ch4A: React.FC = () => (
  <BlocVoix v={ch4a} fichier="ch4a" bandeau={B4} temps={[
    [null, <Intro c="crs" titre={'FILMER\nLA *POLICE*'} petit="CAS N° 4" />],
    ['souviens', <Fige c="crs" a={2} tampon="TU T’EN SOUVIENS ?" taille={100} centre />],
    ['commentaires', <SurFond><Bulles textes={['il a pas le droit de filmer', 'filmer un policier c’est illégal']} /></SurFond>],
    ['faux', <SurFond><Tampon texte="FAUX" taille={220} style={{left: 700, top: 330}} /></SurFond>],
    ['aucun', <SurFond><Gros texte={'AUCUN TEXTE N’INTERDIT\nDE *FILMER* UN POLICIER'} taille={110} /></SurFond>],
    ['conseil', <SurFond><Doc reference="CONSEIL D’ÉTAT · 10 JUIN 2021 · N° 444849" texte="Les journalistes peuvent ainsi [[continuer d’exercer librement leur mission lors de la dispersion d’un attroupement]] sans être tenus de quitter les lieux […]" duree={4} /></SurFond>],
    ['toi', <SurFond><Gros texte={'ET ÇA MARCHE\nPOUR *TOI* AUSSI'} taille={130} /></SurFond>],
    ['témoin', <Intro c="lycee" titre={'UN TÉMOIN FILME\nUNE *INTERPELLATION*'} />],
  ]} />
);
const Ch4B: React.FC = () => (
  <BlocVoix v={ch4b} fichier="ch4b" bandeau={B4} temps={[
    [null, <Fige c="lycee" a={4} tampon="IL A LE DROIT" taille={110} />],
    ['limite', <SurFond><Duel titreA="FILMER" a="oui" titreB="DIFFUSER" b={'attention aux agents\nprotégés par l’anonymat'} coulA={VERT} coulB={ROUGE} /></SurFond>],
    ['chose', <Telephone titre={'LE DÉVERROUILLER\nPOUR LA POLICE ?'} />],
  ]} />
);

const Ch5: React.FC = () => (
  <BlocVoix v={ch5} fichier="ch5" bandeau={B5} temps={[
    [null, <Telephone titre={'« DONNE-MOI\nTON CODE »'} />],
    ['longtemps', <SurFond><Gros petit="7 NOVEMBRE 2022" texte={'LA COUR DE CASSATION\n*TRANCHE*'} taille={120} /></SurFond>],
    ['simple', <SurFond><Gros petit="SA FORMATION LA PLUS SOLENNELLE" texte={'ASSEMBLÉE\n*PLÉNIÈRE*'} taille={150} /></SurFond>],
    ['réponse', <SurFond><Doc reference="COUR DE CASSATION · ASS. PLÉN. · 7 NOVEMBRE 2022" texte="Le code de déverrouillage d’un téléphone mobile [[peut constituer une convention secrète de déchiffrement]]." duree={3.5} taille={50} /></SurFond>],
    ['refuser', <SurFond><Duel titreA="PRISON" a="3 ANS" titreB="AMENDE" b="270 000 €" coulA={ROUGE} coulB={ROUGE} /><Pastille texte="CODE PÉNAL · ART. 434-15-2" de={s(1.2)} style={{left: 700, top: 760}} /></SurFond>],
    ['situation', <SurFond><Liste titre="MAIS SEULEMENT SI…" items={[{t: 'Le téléphone est chiffré (souvent le cas)', ok: true}, {t: 'La demande vient de la justice, dans une enquête', ok: true}]} pas={2.8} haut={280} /></SurFond>],
    ['donc', <SurFond><Duel titreA="SIMPLE CONTRÔLE DANS LA RUE" a={'« donne ton code »\nsans enquête'} titreB="CE QUE PRÉVOIT LE TEXTE" b={'réquisition\ndes autorités judiciaires'} coulA={ROUGE} coulB={VERT} /></SurFond>],
    ['même', <SurFond><Gros texte={'LE JUGE DOIT VÉRIFIER\nQUE LE TÉLÉPHONE ÉTAIT *CHIFFRÉ*'} taille={100} /></SurFond>],
    ['justement', <SurFond><Gros texte={'ET LA *GARDE À VUE* ?'} taille={140} /></SurFond>],
  ]} />
);

const Ch6: React.FC = () => (
  <BlocVoix v={ch6} fichier="ch6" bandeau={B6} temps={[
    [null, <SurFond><Gros petit="CAS N° 6 · RECONSTITUTION" texte={'LA GARDE À VUE\n*JAMAIS FILMÉE*'} taille={130} /></SurFond>],
    ['durée', <Horloge max={24} legende="DURÉE INITIALE" />],
    ['graves', <Horloge max={120} legende="MAXIMUM DANS CERTAINS DOSSIERS TRÈS GRAVES" />],
    ['ensuite', <SurFond><Gros texte={'TES *DROITS*'} taille={180} /></SurFond>],
    ['informé', <SurFond><Liste items={[{t: 'Être informé dès le début', ok: true}, {t: 'Un interprète si besoin', ok: true}]} pas={2.6} haut={300} /></SurFond>],
    ['avocat', <SurFond><Liste items={[{t: 'Un avocat dès le début', ok: true}, {t: 'Audition en sa présence', ok: true}, {t: 'Pas là en 2 h → avocat commis d’office', ok: true}]} pas={2.0} haut={260} /></SurFond>],
    ['prévenir', <SurFond><Liste items={[{t: 'Prévenir un proche ou l’employeur', ok: true}, {t: 'Voir un médecin', ok: true}]} pas={2.4} haut={300} /></SurFond>],
    ['surtout', <SurFond><Gros texte={'LE DROIT\nDE TE *TAIRE*'} taille={170} /></SurFond>],
    ['seule', <SurFond><Gros petit="TA SEULE OBLIGATION" texte="DONNER TON *IDENTITÉ*" taille={130} /></SurFond>],
    ['avouer', <SurFond><Tampon texte="SE TAIRE ≠ AVOUER" taille={130} style={{left: 420, top: 420}} /></SurFond>],
    ['reste', <Route texte="LE DERNIER CAS" />],
  ]} />
);

const Ch7: React.FC = () => (
  <BlocVoix v={ch7} fichier="ch7" bandeau={B7} temps={[
    [null, <Route texte="REFUS D’OBTEMPÉRER" />],
    ['délit', <SurFond><Duel titreA="PRISON" a="2 ANS" titreB="AMENDE" b="15 000 €" coulA={ROUGE} coulB={ROUGE} /><Pastille texte="CODE DE LA ROUTE · ART. L. 233-1" de={s(1.2)} style={{left: 640, top: 760}} /></SurFond>],
    ['danger', <SurFond><Chiffre valeur="5 ANS" legende="SI LA VIE D’AUTRUI EST MISE EN DANGER" couleur={ROUGE} /></SurFond>],
    ['nouveau', <SurFond><Doc reference="LOI N° 2026-798 DU 18 AOÛT 2026 · CODE DE LA ROUTE, ART. L. 233-1" texte="[…] la peine complémentaire de [[confiscation obligatoire]] du véhicule […] La juridiction peut toutefois ne pas prononcer cette peine, [[par une décision spécialement motivée]]." duree={4.5} /></SurFond>],
    ['autrement', <SurFond><Tampon texte="VOITURE CONFISQUÉE" taille={120} style={{left: 380, top: 420}} /></SurFond>],
    ['caméras', <Lapi />],
  ]} />
);

const RECAP = [
  {t: 'Le policier doit te vouvoyer', ok: true},
  {t: 'Le contrôle au faciès est interdit', ok: true},
  {t: 'Refuser un contrôle : non', ok: false},
  {t: 'Fouille : indice ou réquisition', ok: true},
  {t: 'Filmer la police : oui', ok: true},
  {t: 'Code du téléphone : par la justice, en enquête'},
  {t: 'Garde à vue : avocat, médecin, silence', ok: true},
  {t: 'Refus d’obtempérer : la voiture confisquée', ok: false},
];
const Ch8: React.FC = () => (
  <BlocVoix v={ch8} fichier="ch8" temps={[
    [null, <SurFond><Gros texte="RÉCAPITULONS" taille={170} /></SurFond>],
    ['policier', <SurFond><Liste items={RECAP} pas={2.6} haut={60} taille={46} /></SurFond>],
    ['plupart', <SurFond><Gros texte={'PERSONNE NE CONNAÎT\nLES *TEXTES*'} taille={130} /></SurFond>],
    ['maintenant', <SurFond><Gros texte={'MAINTENANT,\n*TOI*, TU LES CONNAIS.'} taille={130} /></SurFond>],
    ['abonne', <SurFond><Gros petit="CHAQUE SEMAINE" texte={'UNE VIDÉO VIRALE\n+ CE QUE DIT *VRAIMENT* LA LOI'} taille={96} /><BoutonAbo de={6} /></SurFond>],
    ['commentaire', <SurFond><Gros texte={'TU AS DÉJÀ VÉCU\nLAQUELLE ?'} taille={130} /></SurFond>],
  ]} />
);

/** Écran de fin : place pour les éléments de fin YouTube (vidéo suggérée à gauche, abonnement à droite). */
const EcranFin: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SurFond>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontFamily: TITRE, fontSize: 110, color: '#fff', opacity: pop(f, 0)}}>
        LE PROCHAIN <span style={{color: JAUNE}}>DOSSIER</span>
      </div>
      <div style={{position: 'absolute', left: 230, top: 330, width: 820, height: 462, borderRadius: 24, border: `8px dashed ${JAUNE}`, opacity: 0.55}} />
      <div style={{position: 'absolute', left: 1260, top: 380, width: 360, height: 360, borderRadius: 180, border: '8px dashed #fff', opacity: 0.55}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: '#cfd8e0', opacity: pop(f, 10)}}>
        CODE OUVERT · LE DROIT, SANS FILTRE
      </div>
    </SurFond>
  );
};

/* ------------------------------------------------------------------ assemblage */

const dv = (v: Voix) => v.duree + 0.5;
const CHAP = 3.0;
const BLOCS: {d: number; el: React.ReactNode}[] = [
  {d: CLIPS.crs.duree, el: <PlanClip c="crs" centre />},
  {d: dv(ch0), el: <Ch0 />},
  {d: CHAP, el: <CarteChapitre n="1" titre="« JE TE TUTOIE, OK ? »" sous="le tutoiement" />},
  {d: dv(ch1a), el: <Ch1A />},
  {d: CLIPS.tutoA.duree, el: <PlanClip c="tutoA" bandeau={B1} />},
  {d: dv(ch1b), el: <Ch1B />},
  {d: CLIPS.tutoB.duree, el: <PlanClip c="tutoB" bandeau={B1} />},
  {d: dv(ch1c), el: <Ch1C />},
  {d: CHAP, el: <CarteChapitre n="2" titre="« C’EST TOUJOURS LES MÊMES »" sous="le contrôle d’identité" />},
  {d: dv(ch2a), el: <Ch2A />},
  {d: CLIPS.facies.duree, el: <PlanClip c="facies" bandeau={B2} />},
  {d: dv(ch2b), el: <Ch2B />},
  {d: CHAP, el: <CarteChapitre n="3" titre="« T’AS PAS LE DROIT DE FOUILLER »" sous="la fouille de la voiture" />},
  {d: dv(ch3a), el: <Ch3A />},
  {d: CLIPS.fouille.duree, el: <PlanClip c="fouille" bandeau={B3} />},
  {d: dv(ch3b), el: <Ch3B />},
  {d: CHAP, el: <CarteChapitre n="4" titre="« TU N’AS PAS LE DROIT DE FILMER »" sous="filmer la police" />},
  {d: dv(ch4a), el: <Ch4A />},
  {d: CLIPS.lycee.duree, el: <PlanClip c="lycee" bandeau={B4} />},
  {d: dv(ch4b), el: <Ch4B />},
  {d: CHAP, el: <CarteChapitre n="5" titre="« DONNE-MOI TON CODE »" sous="le code du téléphone" />},
  {d: dv(ch5), el: <Ch5 />},
  {d: CHAP, el: <CarteChapitre n="6" titre="24 HEURES" sous="la garde à vue" />},
  {d: dv(ch6), el: <Ch6 />},
  {d: CHAP, el: <CarteChapitre n="7" titre="« IL NE S’EST PAS ARRÊTÉ »" sous="le refus d’obtempérer" />},
  {d: dv(ch7), el: <Ch7 />},
  {d: dv(ch8) + 1.0, el: <Ch8 />},
  {d: 15, el: <EcranFin />},
];

const DEBUTS: number[] = [];
BLOCS.forEach((b, i) => DEBUTS.push(i === 0 ? 0 : DEBUTS[i - 1] + s(BLOCS[i - 1].d)));
export const DUREE_POLICE_LONGUE = DEBUTS[DEBUTS.length - 1] + s(BLOCS[BLOCS.length - 1].d);
/** Début de chaque chapitre en secondes (pour les chapitres YouTube dans la description). */
export const CHAPITRES_S = [0, 2, 8, 12, 16, 20, 22, 24].map((i) => DEBUTS[i] / 30);
export const DEBUTS_BLOCS = DEBUTS;

export const PoliceLongue: React.FC = () => (
  <AbsoluteFill style={{background: NUIT}}>
    {BLOCS.map((b, i) => <Sequence key={i} from={DEBUTS[i]} durationInFrames={s(b.d)}>{b.el}</Sequence>)}
  </AbsoluteFill>
);
