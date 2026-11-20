import {MiniBinanceA, MiniBinanceB, MiniBinanceC, MiniCarboneA, MiniCarboneB, MiniCarboneC} from './compositions/MiniaturesLaFaille';
import {Composition, Still} from 'remotion';
import {CoachCouv01, CoachEp01, DUREE_COACH_EP01} from './compositions/coach/CoachEp01';
import {CoachCouv02, CoachEp02, DUREE_COACH_EP02} from './compositions/coach/CoachEp02';
import {DUREE_PANNE_PROTO, PanneProto} from './compositions/panne/PanneProto';
import {DUREE_ONELIFE_PROTO, OneLifeProto} from './compositions/onelife/OneLifeProto';
import {DUREE_REEL3D, Reel3D} from './compositions/onelife/Reel3D';
import {DUREE_EP01, OneLifeEp01} from './compositions/onelife/Ep01';
import {OneLifeProfil} from './compositions/onelife/Profil';
import {DUREE_ILE_PILOTE, IlePilote, IleProfil} from './compositions/ile/IlePilote';
import {IleBanniere} from './compositions/ile/IleBanniere';
import {DUREE_ILE_TT_EP02, IleTikTokEp02} from './compositions/ile/IleTikTokEp02';
import {DUREE_ILE_TT_EP03, IleTikTokEp03} from './compositions/ile/IleTikTokEp03';
import {DUREE_ILE_TT_EP04, IleTikTokEp04} from './compositions/ile/IleTikTokEp04';
import {DUREE_ILE_TT_EP05, IleTikTokEp05} from './compositions/ile/IleTikTokEp05';
import {DUREE_ILE_TT_EP06, IleTikTokEp06} from './compositions/ile/IleTikTokEp06';
import {DUREE_ILE_TT_EP07, IleTikTokEp07} from './compositions/ile/IleTikTokEp07';
import {DUREE_ILE_YT_EP02, IleYouTubeEp02} from './compositions/ile/IleYouTubeEp02';
import {DUREE_ILE_YT_EP03, IleYouTubeEp03} from './compositions/ile/IleYouTubeEp03';
import {DUREE_ILE_YT_EP04, IleYouTubeEp04} from './compositions/ile/IleYouTubeEp04';
import {DUREE_ILE_YT_EP05, IleYouTubeEp05} from './compositions/ile/IleYouTubeEp05';
import {DUREE_ILE_YT_EP06, IleYouTubeEp06} from './compositions/ile/IleYouTubeEp06';
import {DUREE_ILE_YT_EP07, IleYouTubeEp07} from './compositions/ile/IleYouTubeEp07';
import {DUREE_ILE_YT_EP08, IleYouTubeEp08} from './compositions/ile/IleYouTubeEp08';
import {AssembleePilote, DUREE_ASSEMBLEE_PILOTE} from './compositions/assemblee/AssembleePilote';
import {AssembleeTikTokEp02, DUREE_ASSEMBLEE_TT02} from './compositions/assemblee/AssembleeTikTokEp02';
import {AssembleeYouTubeEp02, DUREE_ASSEMBLEE_YT02} from './compositions/assemblee/AssembleeYouTubeEp02';
import {AssembleeTikTokEp03, DUREE_ASSEMBLEE_TT03} from './compositions/assemblee/AssembleeTikTokEp03';
import {AssembleeTikTokEp04, DUREE_ASSEMBLEE_TT04} from './compositions/assemblee/AssembleeTikTokEp04';
import {AssembleeTikTokEp05, DUREE_ASSEMBLEE_TT05} from './compositions/assemblee/AssembleeTikTokEp05';
import {AssembleeTikTokEp06, DUREE_ASSEMBLEE_TT06} from './compositions/assemblee/AssembleeTikTokEp06';
import {AssembleeYouTubeEp04, DUREE_ASSEMBLEE_YT04} from './compositions/assemblee/AssembleeYouTubeEp04';
import {AssembleeYouTubeEp03, DUREE_ASSEMBLEE_YT03} from './compositions/assemblee/AssembleeYouTubeEp03';
import {DUREE_POLICE_PROTO, PoliceProto} from './compositions/police/PoliceProto';
import {DUREE_POLICE_LONGUE, PoliceLongue} from './compositions/police/PoliceLongue';
import {MuseeStill} from './compositions/casse/MuseeStill';
import {ProfilCompte} from './compositions/compte/ProfilCompte';
import {RegimentProfil} from './compositions/regiment/Profil';
import {DUREE_REGIMENT_EP01, RegimentEp01} from './compositions/regiment/RegimentEp01';
import {CasseEp01, DUREE_CASSE_EP01} from './compositions/casse/CasseEp01';
import {CasseEp02, DUREE_CASSE_EP02} from './compositions/casse/CasseEp02';
import {DUREE_LIVRE_PARALYSIE, LivreParalysie} from './compositions/LivreParalysie';
import {DUREE_LIVRE_CORPS, LivreCorps} from './compositions/LivreCorps';
import {FaisLeTest, EpisodeBras} from './compositions/faisletest/FaisLeTest';
import faisletest01 from './videos/faisletest01.json';
import {IllusionCouleurs, IllusionTache} from './compositions/faisletest/Illusions';
import {BornIn, EpisodeBornIn} from './compositions/BornIn';
import bornin01 from './videos/bornin01.json';
import bornin02 from './videos/bornin02.json';
import bornin03 from './videos/bornin03.json';
import {Concerts02, DUREE_CONCERTS02} from './compositions/Concerts02';
import {Concerts02Short, SHORTS_CONCERTS02} from './compositions/Concerts02Shorts';
import {CassesTest, DUREE_CASSES_TEST} from './compositions/CassesTest';
import {BinanceAccroche, DUREE_BINANCE_ACCROCHE} from './compositions/BinanceAccroche';
import {DUREE_LAFAILLE02, LaFaille02} from './compositions/LaFaille02';
import {DUREE_GTA01, GTA01} from './compositions/GTA01';
import {GTA01Short, SHORTS_GTA01, SHORTS_GTA02} from './compositions/GTA01Short';
import {DLBanniere, DLProfil, MiniGTA01, MiniGTA02} from './compositions/DossierLeonida';
import {DUREE_GTA02, GTA02} from './compositions/GTA02';
import {DUREE_LAFAILLE01, LaFaille01} from './compositions/LaFaille01';
import {DUREE_SURVIE, SurvieProto} from './compositions/SurvieProto';
import {DUREE_METRO_PROTO, MetroProto} from './compositions/metro/MetroProto';
import {DernierMetroEp01, DUREE_METRO_EP01} from './compositions/metro/DernierMetroEp01';
import {TuFaisQuoiAvatar} from './compositions/metro/TuFaisQuoiAvatar';
import {DernierMetroEp02, DUREE_METRO_EP02} from './compositions/metro/DernierMetroEp02';
import {DernierMetroEp03, DUREE_METRO_EP03} from './compositions/metro/DernierMetroEp03';
import {AlerteExtreme01, DUREE_ALERTE_01} from './compositions/metro/AlerteExtreme';
import {LaTraque01, DUREE_TRAQUE_01} from './compositions/metro/LaTraque';
import {SuiveurP1, DUREE_SUIVEUR_P1} from './compositions/rentree/SuiveurP1';
import {RentreeAvatar} from './compositions/rentree/RentreeAvatar';
import {SuiveurP2, DUREE_SUIVEUR_P2} from './compositions/rentree/SuiveurP2';
import {SuiveurP3, DUREE_SUIVEUR_P3} from './compositions/rentree/SuiveurP3';
import {Demo} from './compositions/Demo';
import {DUREE_GLASSES01, Glasses01} from './compositions/Glasses01';
import {Glasses01Short, SHORTS_GLASSES01} from './compositions/Glasses01Shorts';
import {Miniature01} from './compositions/Miniature01';
import {Miniature02} from './compositions/Miniature02';
import {DUREE_LUNETTES, Lunettes} from './compositions/Lunettes';
import {DeclassifieProto, DUREE_DECLASSIFIE_PROTO} from './compositions/DeclassifieProto';
import {DUREE_SECRET_IKEA, SecretIkea} from './compositions/SecretIkea';
import {DUREE_TAP_LESSON, TapLesson} from './compositions/lesson/TapLesson';
import {DUREE_POV_TEST, PovTest} from './compositions/lesson/PovTest';
import {ApplePayPov, DUREE_APPLEPAY} from './compositions/lesson/ApplePayPov';
import {DUREE_ECOUTE, PhoneListening} from './compositions/lesson/PhoneListening';
import {DUREE_FOUR, MicroPov} from './compositions/lesson/MicroPov';
import {DUREE_MOTION_TAP, MotionTap} from './compositions/lesson/MotionTap';
import {DUREE_PHONE_LESSON, PhoneLesson} from './compositions/lesson/PhoneLesson';
import {DUREE_MICRO_LESSON, MicroLesson} from './compositions/lesson/MicroLesson';
import {DUREE_RIP_LESSON, RipLesson} from './compositions/lesson/RipLesson';
import {DUREE_KNUCKLE_LESSON, KnuckleLesson} from './compositions/lesson/KnuckleLesson';
import {DUREE_SECRET_HUBLOTS, SecretHublots} from './compositions/SecretHublots';
import {dureeVmax, VmaxMoto} from './compositions/vmax/VmaxMoto';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Vmax01Pcx125" component={VmaxMoto} defaultProps={{ep: '01-pcx125'}} durationInFrames={dureeVmax('01-pcx125')} fps={30} width={1080} height={1920} />
    <Composition id="CoachEp01" component={CoachEp01} durationInFrames={DUREE_COACH_EP01} fps={30} width={1080} height={1920} />
    <Still id="CoachCouv01" component={CoachCouv01} width={1080} height={1920} />
    <Composition id="CoachEp02" component={CoachEp02} durationInFrames={DUREE_COACH_EP02} fps={30} width={1080} height={1920} />
    <Still id="CoachCouv02" component={CoachCouv02} width={1080} height={1920} />
    <Still id="OneLifeProfil" component={OneLifeProfil} width={1080} height={1080} />
    <Composition id="OneLifeEp01" component={OneLifeEp01} durationInFrames={DUREE_EP01} fps={30} width={1080} height={1920} />
    <Composition id="Reel3D" component={Reel3D} durationInFrames={DUREE_REEL3D} fps={30} width={1080} height={1920} />
    <Composition id="OneLifeProto" component={OneLifeProto} durationInFrames={DUREE_ONELIFE_PROTO} fps={30} width={1080} height={1920} />
    <Composition id="PanneProto" component={PanneProto} durationInFrames={DUREE_PANNE_PROTO} fps={30} width={1080} height={1920} />
    <Composition id="AssembleePilote" component={AssembleePilote} durationInFrames={DUREE_ASSEMBLEE_PILOTE} fps={30} width={1080} height={1920} />
    <Composition id="AssembleeTikTokEp02" component={AssembleeTikTokEp02} durationInFrames={DUREE_ASSEMBLEE_TT02} fps={30} width={1080} height={1920} />
    <Composition id="AssembleeYouTubeEp04" component={AssembleeYouTubeEp04} durationInFrames={DUREE_ASSEMBLEE_YT04} fps={30} width={1080} height={1920} />
    <Composition id="AssembleeTikTokEp04" component={AssembleeTikTokEp04} durationInFrames={DUREE_ASSEMBLEE_TT04} fps={30} width={1080} height={1920} />
    <Composition id="AssembleeTikTokEp05" component={AssembleeTikTokEp05} durationInFrames={DUREE_ASSEMBLEE_TT05} fps={30} width={1080} height={1920} />
    <Composition id="AssembleeTikTokEp06" component={AssembleeTikTokEp06} durationInFrames={DUREE_ASSEMBLEE_TT06} fps={30} width={1080} height={1920} />
    <Composition id="AssembleeTikTokEp03" component={AssembleeTikTokEp03} durationInFrames={DUREE_ASSEMBLEE_TT03} fps={30} width={1080} height={1920} />
    <Composition id="AssembleeYouTubeEp03" component={AssembleeYouTubeEp03} durationInFrames={DUREE_ASSEMBLEE_YT03} fps={30} width={1080} height={1920} />
    <Composition id="AssembleeYouTubeEp02" component={AssembleeYouTubeEp02} durationInFrames={DUREE_ASSEMBLEE_YT02} fps={30} width={1080} height={1920} />
    <Composition id="PoliceProto" component={PoliceProto} durationInFrames={DUREE_POLICE_PROTO} fps={30} width={1920} height={1080} />
    <Composition id="PoliceLongue" component={PoliceLongue} durationInFrames={DUREE_POLICE_LONGUE} fps={30} width={1920} height={1080} />
    <Composition id="IlePilote" component={IlePilote} durationInFrames={DUREE_ILE_PILOTE} fps={30} width={1080} height={1920} />
    <Composition id="IleTikTokEp02" component={IleTikTokEp02} durationInFrames={DUREE_ILE_TT_EP02} fps={30} width={1080} height={1920} />
    <Composition id="IleTikTokEp03" component={IleTikTokEp03} durationInFrames={DUREE_ILE_TT_EP03} fps={30} width={1080} height={1920} />
    <Composition id="IleTikTokEp04" component={IleTikTokEp04} durationInFrames={DUREE_ILE_TT_EP04} fps={30} width={1080} height={1920} />
    <Composition id="IleTikTokEp05" component={IleTikTokEp05} durationInFrames={DUREE_ILE_TT_EP05} fps={30} width={1080} height={1920} />
    <Composition id="IleTikTokEp06" component={IleTikTokEp06} durationInFrames={DUREE_ILE_TT_EP06} fps={30} width={1080} height={1920} />
    <Composition id="IleTikTokEp07" component={IleTikTokEp07} durationInFrames={DUREE_ILE_TT_EP07} fps={30} width={1080} height={1920} />
    <Composition id="IleYouTubeEp02" component={IleYouTubeEp02} durationInFrames={DUREE_ILE_YT_EP02} fps={30} width={1080} height={1920} />
    <Composition id="IleYouTubeEp03" component={IleYouTubeEp03} durationInFrames={DUREE_ILE_YT_EP03} fps={30} width={1080} height={1920} />
    <Composition id="IleYouTubeEp04" component={IleYouTubeEp04} durationInFrames={DUREE_ILE_YT_EP04} fps={30} width={1080} height={1920} />
    <Composition id="IleYouTubeEp05" component={IleYouTubeEp05} durationInFrames={DUREE_ILE_YT_EP05} fps={30} width={1080} height={1920} />
    <Composition id="IleYouTubeEp06" component={IleYouTubeEp06} durationInFrames={DUREE_ILE_YT_EP06} fps={30} width={1080} height={1920} />
    <Composition id="IleYouTubeEp07" component={IleYouTubeEp07} durationInFrames={DUREE_ILE_YT_EP07} fps={30} width={1080} height={1920} />
    <Composition id="IleYouTubeEp08" component={IleYouTubeEp08} durationInFrames={DUREE_ILE_YT_EP08} fps={30} width={1080} height={1920} />
    <Composition id="CasseEp02" component={CasseEp02} durationInFrames={DUREE_CASSE_EP02} fps={30} width={1080} height={1920} />
    <Composition id="CasseEp01" component={CasseEp01} durationInFrames={DUREE_CASSE_EP01} fps={30} width={1080} height={1920} />
    <Still id="ProfilCompte-a" component={ProfilCompte} width={1080} height={1080} defaultProps={{variante: 'a' as const}} />
    <Still id="ProfilCompte-b" component={ProfilCompte} width={1080} height={1080} defaultProps={{variante: 'b' as const}} />
    <Still id="ProfilCompte-c" component={ProfilCompte} width={1080} height={1080} defaultProps={{variante: 'c' as const}} />
    <Still id="ProfilCompte-d" component={ProfilCompte} width={1080} height={1080} defaultProps={{variante: 'd' as const}} />
    <Still id="ProfilCompte-e" component={ProfilCompte} width={1080} height={1080} defaultProps={{variante: 'e' as const}} />
    <Composition id="RegimentEp01" component={RegimentEp01} durationInFrames={DUREE_REGIMENT_EP01} fps={30} width={1080} height={1920} />
    <Still id="RegimentProfil" component={RegimentProfil} width={1080} height={1080} />
    <Still id="CasseProfil" component={MuseeStill} width={1080} height={1080} defaultProps={{angle: 'profil'}} />
    <Still id="CasseMusee" component={MuseeStill} width={1080} height={1920} defaultProps={{angle: 'pov' as const}} />
    <Still id="IleProfil" component={IleProfil} width={1080} height={1080} />
    <Still id="IleBanniere" component={IleBanniere} width={2560} height={1440} />
    <Still id="IleBanniereReperes" component={IleBanniere} width={2560} height={1440} defaultProps={{reperes: true}} />
    <Composition id="SecretHublots3D" component={SecretHublots} durationInFrames={DUREE_SECRET_HUBLOTS} fps={30} width={1080} height={1920} defaultProps={{fond3d: true}} />
    <Composition id="SecretHublots" component={SecretHublots} durationInFrames={DUREE_SECRET_HUBLOTS} fps={30} width={1080} height={1920} />
    <Composition id="SecretIkea" component={SecretIkea} durationInFrames={DUREE_SECRET_IKEA} fps={30} width={1080} height={1920} />
    <Composition id="LivreParalysie" component={LivreParalysie} durationInFrames={DUREE_LIVRE_PARALYSIE} fps={30} width={1080} height={1920} />
    <Composition id="LivreCorps" component={LivreCorps} durationInFrames={DUREE_LIVRE_CORPS} fps={30} width={1080} height={1920} />
    <Composition id="DeclassifieProto"component={DeclassifieProto} durationInFrames={DUREE_DECLASSIFIE_PROTO} fps={30} width={1920} height={1080} />
    <Composition id="FaisLeTest-01" component={FaisLeTest} durationInFrames={faisletest01.frames} fps={30} width={1080} height={1920} defaultProps={{ep: faisletest01 as unknown as EpisodeBras}} />
    <Composition id="FaisLeTest-Tache" component={IllusionTache} durationInFrames={840} fps={30} width={1080} height={1920} />
    <Composition id="FaisLeTest-Couleurs" component={IllusionCouleurs} durationInFrames={1140} fps={30} width={1080} height={1920} />
    <Composition id="BornIn01" component={BornIn} durationInFrames={bornin01.frames} fps={30} width={1080} height={1920}
      defaultProps={{ep: bornin01 as unknown as EpisodeBornIn}} />
    <Composition id="BornIn02" component={BornIn} durationInFrames={bornin02.frames} fps={30} width={1080} height={1920}
      defaultProps={{ep: bornin02 as unknown as EpisodeBornIn}} />
    <Composition id="BornIn03" component={BornIn} durationInFrames={bornin03.frames} fps={30} width={1080} height={1920}
      defaultProps={{ep: bornin03 as unknown as EpisodeBornIn}} />
    <Composition id="Glasses01" component={Glasses01} durationInFrames={DUREE_GLASSES01} fps={30} width={1920} height={1080} />
    <Composition id="Concerts02" component={Concerts02} durationInFrames={DUREE_CONCERTS02} fps={30} width={1920} height={1080} />
    <Composition id="Lunettes" component={Lunettes} durationInFrames={DUREE_LUNETTES} fps={30} width={1920} height={1080} />
    <Composition id="CassesTest" component={CassesTest} durationInFrames={DUREE_CASSES_TEST} fps={30} width={1920} height={1080} />
    <Composition id="MiniBinanceA" component={MiniBinanceA} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="MiniBinanceB" component={MiniBinanceB} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="MiniBinanceC" component={MiniBinanceC} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="MiniCarboneA" component={MiniCarboneA} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="MiniCarboneB" component={MiniCarboneB} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="MiniCarboneC" component={MiniCarboneC} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="DLProfil" component={DLProfil} durationInFrames={1} fps={30} width={800} height={800} />
    <Composition id="DLBanniere" component={DLBanniere} durationInFrames={1} fps={30} width={2560} height={1440} />
    <Composition id="MiniGTA01" component={MiniGTA01} durationInFrames={1} fps={30} width={1280} height={720} defaultProps={{v: 'a' as const}} />
    <Composition id="GTA01-s1-disque" component={GTA01Short} durationInFrames={SHORTS_GTA01["s1-disque"].frames} fps={30} width={1080} height={1920} defaultProps={{nom: "s1-disque"}} />
    <Composition id="GTA01-s2-police" component={GTA01Short} durationInFrames={SHORTS_GTA01["s2-police"].frames} fps={30} width={1080} height={1920} defaultProps={{nom: "s2-police"}} />
    <Composition id="GTA01-s3-rumeurs" component={GTA01Short} durationInFrames={SHORTS_GTA01["s3-rumeurs"].frames} fps={30} width={1080} height={1920} defaultProps={{nom: "s3-rumeurs"}} />
    <Composition id="GTA01" component={GTA01} durationInFrames={DUREE_GTA01} fps={30} width={1920} height={1080} />
    <Composition id="MiniGTA02" component={MiniGTA02} durationInFrames={1} fps={30} width={1280} height={720} defaultProps={{v: 'f' as const}} />
    <Composition id="GTA02-s1-netflix" component={GTA01Short} durationInFrames={SHORTS_GTA02["s1-netflix"].frames} fps={30} width={1080} height={1920} defaultProps={{nom: "s1-netflix", video: "gta02" as const}} />
    <Composition id="GTA02-s2-conges" component={GTA01Short} durationInFrames={SHORTS_GTA02["s2-conges"].frames} fps={30} width={1080} height={1920} defaultProps={{nom: "s2-conges", video: "gta02" as const}} />
    <Composition id="GTA02-s3-milliard" component={GTA01Short} durationInFrames={SHORTS_GTA02["s3-milliard"].frames} fps={30} width={1080} height={1920} defaultProps={{nom: "s3-milliard", video: "gta02" as const}} />
    <Composition id="GTA02" component={GTA02} durationInFrames={DUREE_GTA02} fps={30} width={1920} height={1080} />
    <Composition id="LaFaille02" component={LaFaille02} durationInFrames={DUREE_LAFAILLE02} fps={30} width={1920} height={1080} />
    <Composition id="LaFaille01" component={LaFaille01} durationInFrames={DUREE_LAFAILLE01} fps={30} width={1920} height={1080} />
    <Composition id="BinanceAccroche" component={BinanceAccroche} durationInFrames={DUREE_BINANCE_ACCROCHE} fps={30} width={1920} height={1080} />
    <Composition id="SurvieProto"component={SurvieProto} durationInFrames={DUREE_SURVIE} fps={30} width={1920} height={1080} />
    <Composition id="Demo" component={Demo} durationInFrames={675} fps={30} width={1920} height={1080} />
    <Composition id="Miniature01" component={Miniature01} durationInFrames={1} fps={30} width={1280} height={720} defaultProps={{variante: 'a' as const}} />
    <Composition id="Miniature02" component={Miniature02} durationInFrames={1} fps={30} width={1280} height={720} defaultProps={{variante: 'a' as const}} />
    {SHORTS_CONCERTS02.map((s) => (
      <Composition key={s.id} id={`Concerts02-Short${s.id}`} component={Concerts02Short} durationInFrames={s.duree} fps={30} width={1080} height={1920}
        defaultProps={{n: s.id}} />
    ))}
    {SHORTS_GLASSES01.map((s) => (
      <Composition key={s.id} id={`Glasses01-Short${s.id}`} component={Glasses01Short} durationInFrames={s.duree} fps={30} width={1080} height={1920}
        defaultProps={{n: s.id}} />
    ))}
    <Composition id="DernierMetroEp01" component={DernierMetroEp01} durationInFrames={DUREE_METRO_EP01} fps={30} width={1080} height={1920} />
    <Composition id="DernierMetroEp02" component={DernierMetroEp02} durationInFrames={DUREE_METRO_EP02} fps={30} width={1080} height={1920} />
    <Composition id="DernierMetroEp03" component={DernierMetroEp03} durationInFrames={DUREE_METRO_EP03} fps={30} width={1080} height={1920} />
    <Composition id="AlerteExtreme01" component={AlerteExtreme01} durationInFrames={DUREE_ALERTE_01} fps={30} width={1080} height={1920} />
    <Composition id="LaTraque01" component={LaTraque01} durationInFrames={DUREE_TRAQUE_01} fps={30} width={1080} height={1920} />
    <Composition id="TuFaisQuoiAvatar" component={TuFaisQuoiAvatar} durationInFrames={1} fps={30} width={1080} height={1080} />
    <Composition id="SuiveurP1" component={SuiveurP1} durationInFrames={DUREE_SUIVEUR_P1} fps={30} width={1080} height={1920} />
    <Composition id="SuiveurP2" component={SuiveurP2} durationInFrames={DUREE_SUIVEUR_P2} fps={30} width={1080} height={1920} />
    <Composition id="SuiveurP3" component={SuiveurP3} durationInFrames={DUREE_SUIVEUR_P3} fps={30} width={1080} height={1920} />
    <Composition id="RentreeAvatar" component={RentreeAvatar} durationInFrames={1} fps={30} width={1080} height={1080} />
    <Composition id="MetroProto" component={MetroProto} durationInFrames={DUREE_METRO_PROTO} fps={30} width={1080} height={1920} />
    <Composition id="MotionTap" component={MotionTap} durationInFrames={DUREE_MOTION_TAP} fps={30} width={1080} height={1920} />
    <Composition id="MicroPov" component={MicroPov} durationInFrames={DUREE_FOUR} fps={30} width={1080} height={1920} />
    <Composition id="PhoneListening" component={PhoneListening} durationInFrames={DUREE_ECOUTE} fps={30} width={1080} height={1920} />
    <Composition id="ApplePayPov" component={ApplePayPov} durationInFrames={DUREE_APPLEPAY} fps={30} width={1080} height={1920} />
    <Composition id="PovTest" component={PovTest} durationInFrames={DUREE_POV_TEST} fps={30} width={1080} height={1920} />
    <Composition id="TapLesson" component={TapLesson} durationInFrames={DUREE_TAP_LESSON} fps={30} width={1080} height={1920} />
    <Composition id="PhoneLesson" component={PhoneLesson} durationInFrames={DUREE_PHONE_LESSON} fps={30} width={1080} height={1920} />
    <Composition id="MicroLesson" component={MicroLesson} durationInFrames={DUREE_MICRO_LESSON} fps={30} width={1080} height={1920} />
    <Composition id="RipLesson" component={RipLesson} durationInFrames={DUREE_RIP_LESSON} fps={30} width={1080} height={1920} />
    <Composition id="KnuckleLesson" component={KnuckleLesson} durationInFrames={DUREE_KNUCKLE_LESSON} fps={30} width={1080} height={1920} />
  </>
);
