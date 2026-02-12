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
  etherProduction: number;
  imageRectoFile?: string;
  imageVersoFile?: string;
}

export const MORTAL_TEMPLATES: MortalTemplate[] = [
  // === Apollon ===
  {
    god: 'apollon', code: 'APO-01', nameRecto: 'Mydas', nameVerso: 'Mydas (Âne)',
    type: 'animal', cost: 8, etherProduction: 1,
    effectOnMetamorphose: 'Un dieu ne pourra en aucune façon piocher lors de son prochain tour',
    comment: '"En aucune façon" signifie que la phase de pioche saute ET tous les effets qui permettent de piocher ne marcheront pas.',
    imageRectoFile: 'APO-01-recto-Mydas.png', imageVersoFile: 'APO-01-verso-MydasÂne.png',
  },
  {
    god: 'apollon', code: 'APO-02', nameRecto: 'Memnon', nameVerso: 'Memnonides',
    type: 'animal', cost: 14, etherProduction: 0,
    effectOnMetamorphose: 'Vous pouvez défausser jusqu\'à 2 cartes pour incapaciter jusqu\'à 2 mortels ennemis',
    imageRectoFile: 'APO-02-recto-Memnon.png', imageVersoFile: 'APO-02-verso-Memnonides.png',
  },
  {
    god: 'apollon', code: 'APO-03', nameRecto: 'Daédalion', nameVerso: 'Épervier',
    type: 'animal', cost: 12, etherProduction: 0,
    effectOnMetamorphose: 'Générez 7 éther. Détruisez 3 (cliquer sur réservoirs ennemis)',
    imageRectoFile: 'APO-03-recto-Daédalion.png', imageVersoFile: 'APO-03-verso-Épervier.png',
  },
  {
    god: 'apollon', code: 'APO-04', nameRecto: 'Esculape', nameVerso: 'Serpent doré',
    type: 'animal', cost: 22, etherProduction: 1,
    effectOnMetamorphose: 'Volez jusqu\'à 4 Ether à chaque Dieu (cliquer sur réservoirs)',
    imageRectoFile: 'APO-04-recto-Esculape.png', imageVersoFile: 'APO-04-verso-Serpent doré.png',
  },
  {
    god: 'apollon', code: 'APO-05', nameRecto: 'Niobé', nameVerso: 'Source d\'eau',
    type: 'mineral', cost: 19, etherProduction: 0,
    effectPermanent: 'A chaque fois que de l\'Ether est généré en dehors du moment normal (au début du cycle), génère 1 dans votre réservoir.',
    imageRectoFile: 'APO-05-recto-Niobé.png', imageVersoFile: "APO-05-verso-Source d'eau.png",
  },
  {
    god: 'apollon', code: 'APO-06', nameRecto: 'Syrinx', nameVerso: 'Flûte de Pan',
    type: 'vegetal', cost: 9, etherProduction: 1,
    effectPermanent: 'Quand c\'est votre tour, vous pouvez rétromorphoser un de vos mortels de type Animal. Si vous le faites, générez 6 Ether et piochez une carte.',
    imageRectoFile: 'APO-06-recto-Syrinx.png', imageVersoFile: 'APO-06-verso-Flûte de Pan.png',
  },
  {
    god: 'apollon', code: 'APO-07', nameRecto: 'Marsyas', nameVerso: 'Fleuve Marsyas',
    type: 'mineral', cost: 16, etherProduction: 1,
    effectPermanent: 'Vos autres mortels coûtent 1 Ether de moins à métamorphoser',
    imageRectoFile: 'APO-07-recto-Marsyas.png', imageVersoFile: 'APO-07-verso-Fleuve Marsyas.png',
  },
  {
    god: 'apollon', code: 'APO-08', nameRecto: 'Philémon et Baucis', nameVerso: 'Deux arbres',
    type: 'vegetal', cost: 7, etherProduction: 1,
    effectPermanent: 'Si le Cyprès (APO-10) et Hyacinthe (APO-09) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
    comment: '"Invulnérable" = ne peuvent ni être incapacités ni rétromorphosés ni retirés du jeu.',
    imageRectoFile: 'APO-08-recto-Philémon et Baucis.png', imageVersoFile: 'APO-08-verso-Deux arbres.png',
  },
  {
    god: 'apollon', code: 'APO-09', nameRecto: 'Hyacinthe', nameVerso: 'Hyacinthe (fleur)',
    type: 'vegetal', cost: 7, etherProduction: 1,
    effectPermanent: 'Si le Cyprès (APO-10) et Deux arbres (APO-08) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
    imageRectoFile: 'APO-09-recto-Hyacinthe.png', imageVersoFile: 'APO-09-verso-Hyacinthe fleur.png',
  },
  {
    god: 'apollon', code: 'APO-10', nameRecto: 'Cyparissius', nameVerso: 'Cyprès',
    type: 'vegetal', cost: 7, etherProduction: 1,
    effectPermanent: 'Si Hyacinthe (APO-09) et Deux arbres (APO-08) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
    imageRectoFile: 'APO-10-recto-Cyparissius.png', imageVersoFile: 'APO-10-verso-Cyprès.png',
  },
  // === Vénus ===
  {
    god: 'venus', code: 'VEN-01', nameRecto: 'Philomène', nameVerso: 'Rossignol',
    type: 'animal', cost: 9, etherProduction: 1,
    effectPermanent: 'Ne peut pas être incapacité. Rétromorphosez 1 de vos mortels : levez une incapacité.',
    imageRectoFile: 'VEN-01-recto-Philomène.png', imageVersoFile: 'VEN-01-verso-Rossignol.png',
  },
  {
    god: 'venus', code: 'VEN-02', nameRecto: 'Aréthuse', nameVerso: 'Fleuve Alphée',
    type: 'mineral', cost: 7, etherProduction: 0,
    effectPermanent: 'Quand un mortel est incapacité, génère 1 Éther.',
    imageRectoFile: 'VEN-02-recto-Aréthuse.png', imageVersoFile: 'VEN-02-verso-Fleuve Alphée.png',
  },
  {
    god: 'venus', code: 'VEN-03', nameRecto: 'Égérie', nameVerso: 'Fontaine intarissable',
    type: 'mineral', cost: 20, etherProduction: 0,
    effectPermanent: 'Quand un mortel est métamorphosé, génère 1 Éther.',
    imageRectoFile: 'VEN-03-recto-Égérie.png', imageVersoFile: 'VEN-03-verso-Fontaine intarissable.png',
  },
  {
    god: 'venus', code: 'VEN-04', nameRecto: 'Les Méléagrides', nameVerso: 'Oiseaux',
    type: 'animal', cost: 10, etherProduction: 1,
    effectPermanent: 'Vous pouvez à tout moment regarder les réactions posées de tous les dieux.',
    imageRectoFile: 'VEN-04-recto-Les Méléagrides.png', imageVersoFile: 'VEN-04-verso-Oiseaux.png',
  },
  {
    god: 'venus', code: 'VEN-05', nameRecto: 'Byblis', nameVerso: 'Fontaine',
    type: 'mineral', cost: 8, etherProduction: 1,
    effectPermanent: 'Quand un ennemi vous fait défausser, génère 1 Éther.',
    imageRectoFile: 'VEN-05-recto-Byblis.png', imageVersoFile: 'VEN-05-verso-Fontaine.png',
  },
  {
    god: 'venus', code: 'VEN-06', nameRecto: 'Iphigénie', nameVerso: 'Biche',
    type: 'animal', cost: 7, etherProduction: 0,
    effectPermanent: 'Si le Cerf est métamorphosé, rétromorphosez : retirez du jeu un mortel déjà métamorphosé.',
    imageRectoFile: 'VEN-06-recto-Iphigénie.png', imageVersoFile: 'VEN-06-verso-Biche.png',
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
    etherProductionRecto: 2,
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
