import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as loadArchivo} from '@remotion/google-fonts/ArchivoBlack';
import {loadFont as loadDMSerif} from '@remotion/google-fonts/DMSerifDisplay';
import {loadFont as loadInstrument} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as loadMarker} from '@remotion/google-fonts/PermanentMarker';
import {loadFont as loadElite} from '@remotion/google-fonts/SpecialElite';
import {loadFont as loadOps} from '@remotion/google-fonts/BlackOpsOne';
import {loadFont as loadBebas} from '@remotion/google-fonts/BebasNeue';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadSpaceMono} from '@remotion/google-fonts/SpaceMono';
import {loadFont as loadSpaceGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';
import {loadFont as loadMonoton} from '@remotion/google-fonts/Monoton';

const anton = loadAnton('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;
const inter = loadInter('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily;
const mono = loadMono('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily;

/** Les polices du système, par rôle : on alterne, on ne répète jamais deux cartons identiques de suite. */
export const polices = {
  anton,                                                                            // grotesque étroite (défaut)
  bloc: loadArchivo('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,   // grotesque massive
  serif: loadDMSerif('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,  // serif éditoriale
  citation: loadInstrument('italic', {weights: ['400'], subsets: ['latin']}).fontFamily, // citations
  feutre: loadMarker('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,  // annotation manuscrite
  machine: loadElite('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,  // machine à écrire
  tampon: loadOps('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,     // tampon administratif
  mono,
  corps: inter,
  affiche: loadBebas('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,              // affiche de concert
  playfair: loadPlayfair('italic', {weights: ['700'], subsets: ['latin']}).fontFamily,          // citation italique grasse
  spacemono: loadSpaceMono('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily, // billet / reçu
  grotesk: loadSpaceGrotesk('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily,
  setlist: loadCaveat('normal', {weights: ['700'], subsets: ['latin']}).fontFamily,             // annotation manuscrite
  neon: loadMonoton('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,               // enseigne néon
} as const;
export type Police = keyof typeof polices;

/** Une palette par partie de vidéo : fond, texte, texte secondaire, accent. */
export const palettes = {
  nuit: {fond: '#0E1116', encre: '#F2F0EB', sourdine: '#8A94A0', accent: '#D9A441'},
  bleu: {fond: '#0D1F2D', encre: '#EAF2F4', sourdine: '#7FA3B3', accent: '#6FB3A7'},
  papier: {fond: '#EFE8D8', encre: '#16181C', sourdine: '#6B6358', accent: '#B3463C'},
  ambre: {fond: '#D9A441', encre: '#16181C', sourdine: '#5C4312', accent: '#16181C'},
  rouge: {fond: '#3A0D12', encre: '#F3E6D0', sourdine: '#B98C8C', accent: '#E0B45A'},
  route: {fond: '#0A1424', encre: '#EAF0F8', sourdine: '#7C8DA6', accent: '#E8B04A'},
} as const;
export type Palette = keyof typeof palettes;

/** Identité visuelle du kit — un seul fichier à changer pour re-habiller toute une chaîne. */
export const theme = {
  couleur: {
    fond: '#0E1116',
    encre: '#F2F0EB',
    sourdine: '#8A94A0',
    accent: '#D9A441',
    segments: ['#2E7D72', '#D9A441', '#B3463C', '#5B6B7A'],
    surlignage: 'rgba(217,164,65,0.35)',
  },
  // Étalonnage commun : c'est lui qui fait tenir ensemble des sources hétérogènes
  // (photo d'archive, capture de document, image générée). Sans lui, on voit le collage.
  grade: { teinte: 'rgba(60,40,18,0.22)', contraste: 1.06, saturation: 0.82, vignette: 0.55 },
  type: {
    titre: `var(--police-titre, ${anton})`,
    corps: `var(--police-corps, ${inter})`,
    mono: `var(--police-mono, ${mono})`,
    tailleTitre: 92,
    tailleDateline: 64,
    tailleLegende: 30,
  },
  marge: 96,            // 5 % de 1920 : rien de lisible ne sort de cette zone
  duree: { entree: 14, sortie: 10, plan: 150 },
} as const;
