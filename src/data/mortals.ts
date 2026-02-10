import { Mortal, DivinityId } from '@/types/game';

export interface MortalTemplate {
  god: DivinityId;
  code: string;
  nameRecto: string;
  nameVerso: string;
  type?: 'animal' | 'vegetal' | 'mineral';
  cost: number;
  effectOnMetamorphose?: string;
  effectPermanent?: string;
  comment?: string;
  etherProduction: number; // verso ether
  imageRectoFile?: string; // explicit filename override
  imageVersoFile?: string; // explicit filename override
}

// Apollo's 10 mortals from CSV
export const MORTAL_TEMPLATES: MortalTemplate[] = [
  {
    god: 'apollon',
    code: 'APO-01',
    nameRecto: 'Mydas',
    nameVerso: 'Mydas (Âne)',
    type: 'animal',
    cost: 8,
    effectOnMetamorphose: 'Un dieu ne pourra en aucune façon piocher lors de son prochain tour',
    comment: '"En aucune façon" signifie que la phase de pioche saute ET tous les effets qui permettent de piocher ne marcheront pas.',
    etherProduction: 1,
    imageRectoFile: 'APO-01-recto-Mydas.png',
    imageVersoFile: 'APO-01-verso-MydasÂne.png',
  },
  {
    god: 'apollon',
    code: 'APO-02',
    nameRecto: 'Memnon',
    nameVerso: 'Memnonides',
    type: 'animal',
    cost: 14,
    effectOnMetamorphose: 'Vous pouvez défausser jusqu\'à 2 cartes pour incapaciter jusqu\'à 2 mortels ennemis',
    comment: 'Fenêtre demande 0, 1 ou 2 cartes à défausser, puis cliquer sur autant de mortels ennemis.',
    etherProduction: 0,
    imageRectoFile: 'APO-02-recto-Memnon.png',
    imageVersoFile: 'APO-02-verso-Memnonides.png',
  },
  {
    god: 'apollon',
    code: 'APO-03',
    nameRecto: 'Daédalion',
    nameVerso: 'Épervier',
    type: 'animal',
    cost: 12,
    effectOnMetamorphose: 'Générez 7 éther. Détruisez 3 (cliquer sur réservoirs ennemis)',
    etherProduction: 0,
    imageRectoFile: 'APO-03-recto-Daédalion.png',
    imageVersoFile: 'APO-03-verso-Épervier.png',
  },
  {
    god: 'apollon',
    code: 'APO-04',
    nameRecto: 'Esculape',
    nameVerso: 'Serpent doré',
    type: 'animal',
    cost: 22,
    effectOnMetamorphose: 'Volez jusqu\'à 4 Ether à chaque Dieu (cliquer sur réservoirs)',
    etherProduction: 1,
    imageRectoFile: 'APO-04-recto-Esculape.png',
    imageVersoFile: 'APO-04-verso-Serpent doré.png',
  },
  {
    god: 'apollon',
    code: 'APO-05',
    nameRecto: 'Niobé',
    nameVerso: 'Source d\'eau',
    type: 'mineral',
    cost: 19,
    effectPermanent: 'A chaque fois que de l\'Ether est généré en dehors du moment normal (au début du cycle), génère 1 dans votre réservoir.',
    etherProduction: 0,
    imageRectoFile: 'APO-05-recto-Niobé.png',
    imageVersoFile: "APO-05-verso-Source d'eau.png",
  },
  {
    god: 'apollon',
    code: 'APO-06',
    nameRecto: 'Syrinx',
    nameVerso: 'Flûte de Pan',
    type: 'vegetal',
    cost: 9,
    effectPermanent: 'Quand c\'est votre tour, vous pouvez rétromorphoser un de vos mortels de type Animal. Si vous le faites, générez 6 Ether et piochez une carte.',
    etherProduction: 1,
    imageRectoFile: 'APO-06-recto-Syrinx.png',
    imageVersoFile: 'APO-06-verso-Flûte de Pan.png',
  },
  {
    god: 'apollon',
    code: 'APO-07',
    nameRecto: 'Marsyas',
    nameVerso: 'Fleuve Marsyas',
    type: 'mineral',
    cost: 16,
    effectPermanent: 'Vos autres mortels coûtent 1 Ether de moins à métamorphoser',
    etherProduction: 1,
  },
  {
    god: 'apollon',
    code: 'APO-08',
    nameRecto: 'Philémon et Baucis',
    nameVerso: 'Deux arbres',
    type: 'vegetal',
    cost: 7,
    effectPermanent: 'Si le Cyprès (APO-10) et Hyacinthe (APO-09) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
    comment: '"Invulnérable" = ne peuvent ni être incapacités ni rétromorphosés ni retirés du jeu.',
    etherProduction: 1,
  },
  {
    god: 'apollon',
    code: 'APO-09',
    nameRecto: 'Hyacinthe',
    nameVerso: 'Hyacinthe (fleur)',
    type: 'vegetal',
    cost: 7,
    effectPermanent: 'Si le Cyprès (APO-10) et Deux arbres (APO-08) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
    etherProduction: 1,
  },
  {
    god: 'apollon',
    code: 'APO-10',
    nameRecto: 'Cyparissius',
    nameVerso: 'Cyprès',
    type: 'vegetal',
    cost: 7,
    effectPermanent: 'Si Hyacinthe (APO-09) et Deux arbres (APO-08) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
    etherProduction: 1,
  },
];

// Create mortal instances for a player
export function createMortalsForGod(god: DivinityId): Mortal[] {
  const templates = MORTAL_TEMPLATES.filter(t => t.god === god);
  
  // If god's mortals aren't defined yet, create placeholder mortals
  if (templates.length === 0) {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `mortal-${god}-${i}-${crypto.randomUUID().slice(0, 6)}`,
      code: `${god.toUpperCase().slice(0, 3)}-${String(i + 1).padStart(2, '0')}`,
      god,
      nameRecto: `Mortel ${i + 1}`,
      nameVerso: `Métamorphe ${i + 1}`,
      cost: Math.floor(Math.random() * 15) + 5,
      etherProduction: Math.random() > 0.5 ? 1 : 0,
      etherProductionRecto: 2,
      isMetamorphosed: false,
      status: 'normal' as const,
      position: i,
      imageRecto: '',
      imageVerso: '',
    }));
  }

  return templates.map((t, i) => ({
    id: `mortal-${t.code}-${crypto.randomUUID().slice(0, 6)}`,
    code: t.code,
    god: t.god,
    nameRecto: t.nameRecto,
    nameVerso: t.nameVerso,
    type: t.type,
    cost: t.cost,
    etherProduction: t.etherProduction,
    etherProductionRecto: 2, // All rectos produce 2
    isMetamorphosed: false,
    status: 'normal' as const,
    position: i,
    effectOnMetamorphose: t.effectOnMetamorphose,
    effectPermanent: t.effectPermanent,
    comment: t.comment,
    imageRecto: t.imageRectoFile ? `/mortals/${t.imageRectoFile}` : '',
    imageVerso: t.imageVersoFile ? `/mortals/${t.imageVersoFile}` : '',
  }));
}
