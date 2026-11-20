import {AbsoluteFill, Series} from 'remotion';
import {ArchivePlate} from '../components/ArchivePlate';
import {DatelineCard} from '../components/DatelineCard';
import {DocumentFrame} from '../components/DocumentFrame';
import {Grade} from '../components/Grade';
import {LowerThird} from '../components/LowerThird';
import {PriceBreakdown} from '../components/PriceBreakdown';
import {TitleCard} from '../components/TitleCard';

/** Démonstration : tous les composants du kit, sur des chiffres réels et sourcés. */
export const Demo: React.FC = () => (
  <Grade>
    <Series>
      <Series.Sequence durationInFrames={90}>
        <AbsoluteFill>
          <ArchivePlate src="01-hero.jpg" mouvement="avant" />
          <LowerThird nom="$95" fonction="Warby Parker entry price" />
        </AbsoluteFill>
      </Series.Sequence>

      <Series.Sequence durationInFrames={75}>
        <DatelineCard lignes={['Fiscal year 2025.', 'Warby Parker, annual report.']} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={120}>
        <DocumentFrame
          titre="WARBY PARKER — FY2025"
          lignes={[
            'Net revenue — $872 million',
            'Gross margin — 54.0%',
            'Marketing — $110 million',
            'Net income — $1.6 million',
          ]}
          surligne={3}
          source="Excerpts — Warby Parker Inc., Form 10-K FY2025 (SEC EDGAR)"
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={60}>
        <TitleCard titre="The Breakdown" sous="Where $100 actually goes" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={150}>
        <PriceBreakdown
          total={100}
          segments={[
            {libelle: 'Cost of goods sold', montant: 46.0},
            {libelle: 'Stores, staff, technology', montant: 42.0},
            {libelle: 'Marketing', montant: 12.6},
            {libelle: 'Net profit', montant: 0.19},
          ]}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={90}>
        <AbsoluteFill>
          <ArchivePlate src="02-usine.jpg" mouvement="arriere" />
          <LowerThird nom="$8.50" fonction="A pair of lenses, declared import value, US (UN Comtrade 2024)" />
        </AbsoluteFill>
      </Series.Sequence>

      <Series.Sequence durationInFrames={90}>
        <AbsoluteFill>
          <ArchivePlate src="03-boutique.jpg" mouvement="avant" />
          <LowerThird nom="$11.90" fonction="An average frame, declared import value, US (UN Comtrade 2024)" />
        </AbsoluteFill>
      </Series.Sequence>
    </Series>
  </Grade>
);
