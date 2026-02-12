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
}

// All image files use ASCII-safe names: /mortals/{CODE}-recto.png and /mortals/{CODE}-verso.png
function mortalImagePath(code: string, side: 'recto' | 'verso'): string {
  return `/mortals/${code}-${side}.png`;
}

export const MORTAL_TEMPLATES: MortalTemplate[] = [
  // === Apollon ===
  {
    god: 'apollon', code: 'APO-01', nameRecto: 'Mydas', nameVerso: 'Mydas (Âne)',
    type: 'animal', cost: 8, etherProduction: 1,
    effectOnMetamorphose: 'Un dieu ne pourra en aucune façon piocher lors de son prochain tour',
    comment: '"En aucune façon" signifie que la phase de pioche saute ET tous les effets qui permettent de piocher ne marcheront pas.',
  },
  {
    god: 'apollon', code: 'APO-02', nameRecto: 'Memnon', nameVerso: 'Memnonides',
    type: 'animal', cost: 14, etherProduction: 0,
    effectOnMetamorphose: 'Vous pouvez défausser jusqu\'à 2 cartes pour incapaciter jusqu\'à 2 mortels ennemis',
  },
  {
    god: 'apollon', code: 'APO-03', nameRecto: 'Daédalion', nameVerso: 'Épervier',
    type: 'animal', cost: 12, etherProduction: 0,
    effectOnMetamorphose: 'Générez 7 éther. Détruisez 3 (cliquer sur réservoirs ennemis)',
  },
  {
    god: 'apollon', code: 'APO-04', nameRecto: 'Esculape', nameVerso: 'Serpent doré',
    type: 'animal', cost: 22, etherProduction: 1,
    effectOnMetamorphose: 'Volez jusqu\'à 4 Ether à chaque Dieu (cliquer sur réservoirs)',
  },
  {
    god: 'apollon', code: 'APO-05', nameRecto: 'Niobé', nameVerso: 'Source d\'eau',
    type: 'mineral', cost: 19, etherProduction: 0,
    effectPermanent: 'A chaque fois que de l\'Ether est généré en dehors du moment normal (au début du cycle), génère 1 dans votre réservoir.',
  },
  {
    god: 'apollon', code: 'APO-06', nameRecto: 'Syrinx', nameVerso: 'Flûte de Pan',
    type: 'vegetal', cost: 9, etherProduction: 1,
    effectPermanent: 'Quand c\'est votre tour, vous pouvez rétromorphoser un de vos mortels de type Animal. Si vous le faites, générez 6 Ether et piochez une carte.',
  },
  {
    god: 'apollon', code: 'APO-07', nameRecto: 'Marsyas', nameVerso: 'Fleuve Marsyas',
    type: 'mineral', cost: 16, etherProduction: 1,
    effectPermanent: 'Vos autres mortels coûtent 1 Ether de moins à métamorphoser',
  },
  {
    god: 'apollon', code: 'APO-08', nameRecto: 'Philémon et Baucis', nameVerso: 'Deux arbres',
    type: 'vegetal', cost: 7, etherProduction: 1,
    effectPermanent: 'Si le Cyprès (APO-10) et Hyacinthe (APO-09) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
    comment: '"Invulnérable" = ne peuvent ni être incapacités ni rétromorphosés ni retirés du jeu.',
  },
  {
    god: 'apollon', code: 'APO-09', nameRecto: 'Hyacinthe', nameVerso: 'Hyacinthe (fleur)',
    type: 'vegetal', cost: 7, etherProduction: 1,
    effectPermanent: 'Si le Cyprès (APO-10) et Deux arbres (APO-08) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
  },
  {
    god: 'apollon', code: 'APO-10', nameRecto: 'Cyparissius', nameVerso: 'Cyprès',
    type: 'vegetal', cost: 7, etherProduction: 1,
    effectPermanent: 'Si Hyacinthe (APO-09) et Deux arbres (APO-08) sont métamorphosés, vos mortels métamorphosés sont invulnérables',
  },
  // === Vénus ===
  {
    god: 'venus', code: 'VEN-01', nameRecto: 'Philomène', nameVerso: 'Rossignol',
    type: 'animal', cost: 9, etherProduction: 1,
    effectPermanent: 'Ne peut pas être incapacité. Rétromorphosez 1 de vos mortels : levez une incapacité.',
  },
  {
    god: 'venus', code: 'VEN-02', nameRecto: 'Aréthuse', nameVerso: 'Fleuve Alphée',
    type: 'mineral', cost: 7, etherProduction: 0,
    effectPermanent: 'Quand un mortel est incapacité, génère 1 Éther.',
  },
  {
    god: 'venus', code: 'VEN-03', nameRecto: 'Égérie', nameVerso: 'Fontaine intarissable',
    type: 'mineral', cost: 20, etherProduction: 0,
    effectPermanent: 'Quand un mortel est métamorphosé, génère 1 Éther.',
  },
  {
    god: 'venus', code: 'VEN-04', nameRecto: 'Les Méléagrides', nameVerso: 'Oiseaux',
    type: 'animal', cost: 10, etherProduction: 1,
    effectPermanent: 'Vous pouvez à tout moment regarder les réactions posées de tous les dieux.',
  },
  {
    god: 'venus', code: 'VEN-05', nameRecto: 'Byblis', nameVerso: 'Fontaine',
    type: 'mineral', cost: 8, etherProduction: 1,
    effectPermanent: 'Quand un ennemi vous fait défausser, génère 1 Éther.',
  },
  {
    god: 'venus', code: 'VEN-06', nameRecto: 'Iphigénie', nameVerso: 'Biche',
    type: 'animal', cost: 7, etherProduction: 0,
    effectPermanent: 'Si le Cerf est métamorphosé, rétromorphosez : retirez du jeu un mortel déjà métamorphosé.',
  },
  {
    god: 'venus', code: 'VEN-07', nameRecto: 'Actéon', nameVerso: 'Cerf',
    type: 'animal', cost: 7, etherProduction: 0,
    effectPermanent: 'Si la Biche (VEN-06) est métamorphosée, rétromorphosez : retirez du jeu un mortel déjà métamorphosé.',
  },
  {
    god: 'venus', code: 'VEN-08', nameRecto: 'Coronis', nameVerso: 'Corneille',
    type: 'animal', cost: 1, etherProduction: 0,
    effectPermanent: 'Aucun effet permanent.',
  },
  {
    god: 'venus', code: 'VEN-09', nameRecto: 'Les Héliades', nameVerso: 'Pins',
    type: 'vegetal', cost: 12, etherProduction: 1,
    effectPermanent: 'Quand un mortel est retiré du jeu, piochez 2. Défaussez 2 : générez 1.',
  },
  {
    god: 'venus', code: 'VEN-10', nameRecto: 'Anaxarète', nameVerso: 'Statue d\'Anaxarète',
    type: 'mineral', cost: 12, etherProduction: 1,
    effectPermanent: 'Rétromorphosez : incapacitez un mortel ennemi.',
  },
];

// Create mortal instances for a player
export function createMortalsForGod(god: DivinityId): Mortal[] {
  const templates = MORTAL_TEMPLATES.filter(t => t.god === god);
  
  // If god's mortals aren't defined yet, create placeholder mortals
  if (templates.length === 0) {
    return Array.from({ length: 10 }, (_, i) => {
      const code = `${god.toUpperCase().slice(0, 3)}-${String(i + 1).padStart(2, '0')}`;
      return {
        id: `mortal-${god}-${i}-${crypto.randomUUID().slice(0, 6)}`,
        code,
        god,
        nameRecto: `Mortel ${i + 1}`,
        nameVerso: `Métamorphe ${i + 1}`,
        cost: Math.floor(Math.random() * 15) + 5,
        etherProduction: Math.random() > 0.5 ? 1 : 0,
        etherProductionRecto: 2,
        isMetamorphosed: false,
        status: 'normal' as const,
        position: i,
        imageRecto: mortalImagePath(code, 'recto'),
        imageVerso: mortalImagePath(code, 'verso'),
      };
    });
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
    imageRecto: mortalImagePath(t.code, 'recto'),
    imageVerso: mortalImagePath(t.code, 'verso'),
  }));
}
