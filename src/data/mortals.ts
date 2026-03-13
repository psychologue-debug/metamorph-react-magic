import { Mortal, DivinityId } from '@/types/game';
import { generateUUID } from '@/lib/uuid';

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
    comment: 'Une fenêtre demande au joueur actif s\'il veut défausser 0, 1 ou 2 cartes. Il clique sur un des trois chiffres, puis clique sur autant de cartes. Elles sont défaussées. Ensuite, si 1 ou 2 cartes ont été défaussées, une fenêtre dit au joueur actif de cliquer sur 1 ou 2 mortels ennemis pour les incapaciter.',
  },
  {
    god: 'apollon', code: 'APO-03', nameRecto: 'Daédalion', nameVerso: 'Épervier',
    type: 'animal', cost: 12, etherProduction: 0,
    effectOnMetamorphose: 'Générez 7 éther. Détruisez 3',
    comment: 'Pour la génération, c\'est le réservoir du joueur actif qui monte. Pour la destruction, il faut cliquer autant de fois sur les réservoirs ennemis.',
  },
  {
    god: 'apollon', code: 'APO-04', nameRecto: 'Esculape', nameVerso: 'Serpent doré',
    type: 'animal', cost: 22, etherProduction: 1,
    effectOnMetamorphose: 'Volez jusqu\'à 4 Ether à chaque Dieu',
    comment: 'Il faut cliquer jusqu\'à 4 fois sur chaque réservoir pour voler autant d\'ether. Le réservoir du joueur actif augmente d\'autant.',
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
    effectPermanent: 'Ne peut pas être incapacité. Vous pouvez rétromorphoser un de vos mortels pour lever une incapacité.',
  },
  {
    god: 'venus', code: 'VEN-02', nameRecto: 'Aréthuse', nameVerso: 'Fleuve Alphée',
    type: 'mineral', cost: 7, etherProduction: 0,
    effectPermanent: 'Quand un mortel est incapacité, génère 1 Éther.',
    comment: 'Nécessite un event listener pour les incapacitations.',
  },
  {
    god: 'venus', code: 'VEN-03', nameRecto: 'Égérie', nameVerso: 'Fontaine intarissable',
    type: 'mineral', cost: 20, etherProduction: 0,
    effectPermanent: 'Quand un mortel est métamorphosé, génère 1 Éther.',
  },
  {
    god: 'venus', code: 'VEN-04', nameRecto: 'Les Méléagrides', nameVerso: 'Oiseaux',
    type: 'animal', cost: 10, etherProduction: 1,
    effectPermanent: 'Vous pouvez à tout moment regarder les réactions posées des autres dieux.',
    comment: 'Quand les Oiseaux sont métamorphosés, le joueur de Vénus peut, en hover sur les cartes réactions cachées des autres dieux, les voir dans un tooltip. Les Oiseaux doivent briller pendant l\'affichage.',
  },
  {
    god: 'venus', code: 'VEN-05', nameRecto: 'Byblis', nameVerso: 'Fontaine',
    type: 'mineral', cost: 8, etherProduction: 1,
    effectPermanent: 'Quand un effet ennemi vous fait défausser, génère 1 Éther.',
    comment: 'Si plusieurs cartes sont défaussées par le même effet, ça ne génère qu\'1 seul Éther. Il faut tracker de quel dieu vient l\'effet.',
  },
  {
    god: 'venus', code: 'VEN-06', nameRecto: 'Iphigénie', nameVerso: 'Biche',
    type: 'animal', cost: 7, etherProduction: 0,
    effectOnMetamorphose: 'Si le Cerf (VEN-07) est métamorphosé, vous pouvez retirer du jeu un mortel ennemi déjà métamorphosé.',
    comment: 'Les mortels "retirés du jeu" deviennent gris (saturation 0), ne peuvent plus rien faire ni être ciblés. Ils restent métamorphosés.',
  },
  {
    god: 'venus', code: 'VEN-07', nameRecto: 'Actéon', nameVerso: 'Cerf',
    type: 'animal', cost: 7, etherProduction: 0,
    effectOnMetamorphose: 'Si la Biche (VEN-06) est métamorphosée, vous pouvez retirer du jeu un mortel ennemi déjà métamorphosé.',
    comment: 'Les mortels "retirés du jeu" deviennent gris (saturation 0), ne peuvent plus rien faire ni être ciblés. Ils restent métamorphosés.',
  },
  {
    god: 'venus', code: 'VEN-08', nameRecto: 'Coronis', nameVerso: 'Corneille',
    type: 'animal', cost: 1, etherProduction: 0,
  },
  {
    god: 'venus', code: 'VEN-09', nameRecto: 'Les Héliades', nameVerso: 'Pins',
    type: 'vegetal', cost: 12, etherProduction: 1,
    effectPermanent: 'Quand un mortel est retiré du jeu, piochez 2 cartes. Défaussez 2 cartes : générez 1 Éther.',
    comment: 'L\'effet de défausser 2 cartes pour générer 1 Éther peut être fait autant de fois qu\'on veut pendant son tour. Nécessite un event listener pour le retrait du jeu.',
  },
  {
    god: 'venus', code: 'VEN-10', nameRecto: 'Anaxarète', nameVerso: 'Statue d\'Anaxarète',
    type: 'mineral', cost: 12, etherProduction: 1,
    effectOnMetamorphose: 'Incapacitez un mortel ennemi.',
    comment: 'S\'il n\'y a pas de cible légale (mortels déjà incapacités ou non métamorphosés), un message avertit "Aucune cible possible !"',
  },
  // === Bacchus ===
  {
    god: 'bacchus', code: 'BAC-01', nameRecto: 'Lycaon', nameVerso: 'Lycaon (Animal)',
    type: 'animal', cost: 6, etherProduction: 1,
    effectPermanent: 'Rétromorphosez ce mortel : Un dieu défausse toutes ses cartes (même les réactions posées).',
  },
  {
    god: 'bacchus', code: 'BAC-02', nameRecto: 'Matelos tyrrhéniens', nameVerso: 'Dauphins',
    type: 'animal', cost: 18, etherProduction: 1,
    effectOnMetamorphose: 'Vous pouvez métamorphoser un autre mortel en payant 6 Ether de plus que son coût.',
    comment: 'Une fenêtre demande si le joueur souhaite utiliser l\'effet. Si OUI, le jeu demande quel mortel métamorphoser. Si pas assez d\'Éther, message "pas assez d\'Éther". Bouton "annuler" disponible.',
  },
  {
    god: 'bacchus', code: 'BAC-03', nameRecto: 'Les Isméniennes', nameVerso: 'Mouettes',
    type: 'animal', cost: 10, etherProduction: 1,
    effectOnMetamorphose: 'Volez 3 Ether n\'importe où. Volez une carte à un dieu.',
    comment: 'Il faut cliquer sur le réservoir duquel on veut voler. Il faut cliquer sur la carte qu\'on veut voler.',
  },
  {
    god: 'bacchus', code: 'BAC-04', nameRecto: 'Les filles d\'Anius', nameVerso: 'Quatre Colombes',
    type: 'animal', cost: 18, etherProduction: 1,
    effectOnMetamorphose: 'Déplacez jusqu\'à 4 incapacités d\'un mortel à un autre.',
    comment: 'Cela doit trigger les events "mortal_incapacitated" et "mortal_healed" autant de fois que le joueur choisit.',
  },
  {
    god: 'bacchus', code: 'BAC-05', nameRecto: 'Myrrha', nameVerso: 'Arbre à Myrrhe',
    type: 'vegetal', cost: 8, etherProduction: 1,
    effectOnMetamorphose: 'Si les Arbres (BAC-08) et le Tournesol (BAC-06) sont métamorphosés, incapacitez jusqu\'à 2 mortels.',
  },
  {
    god: 'bacchus', code: 'BAC-06', nameRecto: 'Clytie', nameVerso: 'Tournesol',
    type: 'vegetal', cost: 7, etherProduction: 1,
    effectOnMetamorphose: 'Si les Arbres (BAC-08) sont métamorphosés, choisissez entre : Incapacitez un mortel OU Levez une incapacité.',
    comment: 'Une fenêtre apparait pour demander au joueur de choisir. Il doit ensuite cliquer sur le mortel à cibler.',
  },
  {
    god: 'bacchus', code: 'BAC-07', nameRecto: 'Battus', nameVerso: 'Statue de Battus',
    type: 'mineral', cost: 6, etherProduction: 0,
    effectOnMetamorphose: 'Incapacitez un mortel.',
  },
  {
    god: 'bacchus', code: 'BAC-08', nameRecto: 'Les Ménades', nameVerso: 'Arbres',
    type: 'vegetal', cost: 5, etherProduction: 1,
  },
  {
    god: 'bacchus', code: 'BAC-09', nameRecto: 'Les trois filles de Mynias', nameVerso: 'Trois chauve-souris',
    type: 'animal', cost: 9, etherProduction: 1,
    effectPermanent: 'Vos cartes (sortilège ET réactions) coûtent 1 Ether de moins à jouer.',
    comment: 'Ce coût réduit doit apparaître sur les cartes en main et réactions posées.',
  },
  {
    god: 'bacchus', code: 'BAC-10', nameRecto: 'Arné', nameVerso: 'Corneille',
    type: 'animal', cost: 6, etherProduction: 1,
    effectPermanent: 'Rétromorphosez ce mortel : générez 8 Éther.',
  },
  // === Minerve ===
  {
    god: 'minerve', code: 'MIN-01', nameRecto: 'Paysans', nameVerso: 'Grenouilles',
    type: 'animal', cost: 8, etherProduction: 1,
    effectOnMetamorphose: 'Chaque Dieu ennemi se défausse d\'une carte. Si ce n\'est pas le premier mortel que vous métamorphosez ce tour, l\'effet est remplacé par : Chaque dieu ennemi se défausse de 2 cartes et vous gagnez autant d\'Éther que de cartes défaussées.',
    comment: 'Il faut tracker si c\'est ou non le deuxième/troisième mortel métamorphosé ce tour par le joueur de Minerve.',
  },
  {
    god: 'minerve', code: 'MIN-02', nameRecto: 'Ajax', nameVerso: 'Hyacinthe',
    type: 'vegetal', cost: 8, etherProduction: 1,
    effectPermanent: 'Rétromorphosez Ajax : vous pouvez métamorphoser un mortel supplémentaire ce tour-ci.',
    comment: 'Même effet que le sort "Rage".',
  },
  {
    god: 'minerve', code: 'MIN-03', nameRecto: 'Perdrix', nameVerso: 'Perdrie',
    type: 'animal', cost: 10, etherProduction: 1,
    effectPermanent: 'L\'Éther qu\'il génère est volé à un dieu de votre choix.',
    comment: 'Au début du cycle, une fenêtre demande au joueur de cliquer sur le réservoir d\'Éther du Dieu dont il veut voler l\'Éther.',
  },
  {
    god: 'minerve', code: 'MIN-04', nameRecto: 'Echo', nameVerso: 'Montagne',
    type: 'mineral', cost: 18, etherProduction: 0,
    effectPermanent: 'Quand un de vos mortels génère de l\'Éther grâce à son effet, génère 1 Éther.',
    comment: 'Cela n\'inclut pas Perdrie (MIN-03).',
  },
  {
    god: 'minerve', code: 'MIN-05', nameRecto: 'Cénée', nameVerso: 'Phoenix',
    type: 'animal', cost: 4, etherProduction: 0,
    effectPermanent: 'Quand vous métamorphosez un mortel au-delà du premier ce tour, génère 4 Éther.',
  },
  {
    god: 'minerve', code: 'MIN-06', nameRecto: 'Dents de serpent', nameVerso: 'Soldats de Thèbes',
    type: 'animal', cost: 30, etherProduction: 3,
    effectPermanent: 'Invulnérable (ne peut pas être retiré du jeu, rétromorphosé ni incapacité).',
  },
  {
    god: 'minerve', code: 'MIN-07', nameRecto: 'Arachné', nameVerso: 'Araignée',
    type: 'animal', cost: 6, etherProduction: 0,
    effectPermanent: 'Quand une réaction est jouée, génère 1 Éther.',
  },
  {
    god: 'minerve', code: 'MIN-08', nameRecto: 'Calisto', nameVerso: 'Ours',
    type: 'animal', cost: 12, etherProduction: 1,
    effectOnMetamorphose: 'Si ce n\'est pas le premier mortel que vous métamorphosez ce tour, retirez du jeu un mortel métamorphosé.',
    effectPermanent: 'Retirez du jeu Ours et payez 7 Éther : Retirez du jeu un mortel déjà métamorphosé.',
  },
  {
    god: 'minerve', code: 'MIN-09', nameRecto: 'Nyctimène', nameVerso: 'Chouette de Minerve',
    type: 'animal', cost: 10, etherProduction: 0,
    effectOnMetamorphose: 'Levez une incapacité. Si ce n\'est pas le premier mortel que vous métamorphosez ce tour-ci, levez toutes les incapacités de vos mortels.',
    effectPermanent: 'Ne peut pas être rétromorphosé ni sorti du jeu.',
  },
  {
    god: 'minerve', code: 'MIN-10', nameRecto: 'Aglaure', nameVerso: 'Statue de Aglaure',
    type: 'mineral', cost: 11, etherProduction: 1,
    effectOnMetamorphose: 'Incapacitez un mortel ennemi. Si ce n\'est pas le premier mortel que vous métamorphosez ce tour-ci, incapacitez jusqu\'à 2 mortels ennemis.',
  },
  // === Diane ===
  {
    god: 'diane', code: 'DIA-01', nameRecto: 'Alcione et Céyx', nameVerso: 'Alcyon',
    type: 'animal', cost: 10, etherProduction: 3,
    effectPermanent: 'Si vous avez 3 mortels métamorphosés ou plus, Alcyon génère 0 à la place de 3 Éther par cycle.',
    comment: 'Si la condition est remplie, un "0" doit apparaître à l\'endroit du nombre d\'Éther générés.',
  },
  {
    god: 'diane', code: 'DIA-02', nameRecto: 'Adonis', nameVerso: 'Adonis fleur',
    type: 'vegetal', cost: 9, etherProduction: 1,
    effectPermanent: 'Une fois par tour, vous pouvez rétromorphoser un de vos mortels. Si vous le faites, détruisez 5 Éther.',
    comment: 'Une bulle indique au joueur qu\'il doit cliquer sur les réservoirs qu\'il veut attaquer.',
  },
  {
    god: 'diane', code: 'DIA-03', nameRecto: 'Atalante', nameVerso: 'Lion',
    type: 'animal', cost: 9, etherProduction: 1,
    effectOnMetamorphose: 'Un dieu ennemi défausse 2 cartes et perd 2 Éther.',
    comment: 'Une fenêtre montre tous les dieux. Le joueur clique sur celui à cibler. Le dieu ciblé voit une fenêtre "vous avez perdu 2 Éther. Sélectionnez deux cartes à défausser."',
  },
  {
    god: 'diane', code: 'DIA-04', nameRecto: 'Cadmus et Harmonie', nameVerso: 'Deux serpents',
    type: 'animal', cost: 19, etherProduction: 3,
    effectPermanent: 'Au moment de la génération d\'Éther (début du cycle), génère 1 Éther pour chaque dieu ennemi.',
  },
  {
    god: 'diane', code: 'DIA-05', nameRecto: 'Les compagnons de Diomède', nameVerso: 'Mouettes',
    type: 'animal', cost: 12, etherProduction: 0,
    effectPermanent: 'Quand de l\'Éther est détruit, génère 2 Éther.',
  },
  {
    god: 'diane', code: 'DIA-06', nameRecto: 'Hermaphrodite et Salmasis', nameVerso: 'Hermaphrodite',
    type: 'animal', cost: 16, etherProduction: 1,
    effectOnMetamorphose: 'Jouez un sort en réduisant son coût de 10.',
    comment: 'Une fenêtre demande immédiatement si le joueur veut jouer un sort à coût réduit de 10. OUI ou NON. Si OUI, il clique sur le sort à jouer.',
  },
  {
    god: 'diane', code: 'DIA-07', nameRecto: 'Callisto et Arcas', nameVerso: 'Grande Ours',
    type: 'mineral', cost: 19, etherProduction: 0,
    effectPermanent: 'Invulnérable. Tous les mortels ennemis coûtent 1 Éther de plus à métamorphoser.',
  },
  {
    god: 'diane', code: 'DIA-08', nameRecto: 'Les cérastes', nameVerso: 'Taureaux',
    type: 'animal', cost: 7, etherProduction: 1,
    effectPermanent: 'Retirez les Taureaux du jeu : Générez 3 Éther et détruisez 3 Éther.',
    comment: 'Pour détruire l\'Éther il faut cliquer sur les réservoirs.',
  },
  {
    god: 'diane', code: 'DIA-09', nameRecto: 'Les propétides', nameVerso: 'Pierres',
    type: 'mineral', cost: 11, etherProduction: 0,
    effectOnMetamorphose: 'Choisissez entre : SOIT incapacitez un mortel ; SOIT levez une incapacité ; SOIT détruisez 4 Éther.',
    comment: 'Une fenêtre demande au joueur de choisir entre les 3 options, puis il clique sur les mortels ou réservoirs.',
  },
  {
    god: 'diane', code: 'DIA-10', nameRecto: 'Ardée', nameVerso: 'Héron',
    type: 'animal', cost: 4, etherProduction: 0,
    effectPermanent: 'Défaussez 4 cartes (sortilège ou réactions, posées ou non) pour rétromorphoser le Héron et un mortel ennemi.',
  },
  // === Neptune ===
  {
    god: 'neptune', code: 'NEP-01', nameRecto: 'Thétis', nameVerso: 'Banc de poissons',
    type: 'animal', cost: 5, etherProduction: 0,
    effectPermanent: 'Quand un effet de mortel ou une carte vous fait défausser, générez 1 Éther.',
  },
  {
    god: 'neptune', code: 'NEP-02', nameRecto: 'Périmèle', nameVerso: 'Île de Périmèle',
    type: 'mineral', cost: 9, etherProduction: 1,
    effectPermanent: 'Payez 3 Éther : Piochez 1 carte, puis défaussez 1 carte.',
  },
  {
    god: 'neptune', code: 'NEP-03', nameRecto: 'Bateaux grecs', nameVerso: 'Naïade des mers',
    type: 'animal', cost: 12, etherProduction: 1,
    effectPermanent: 'Quand un mortel végétal est métamorphosé, générez 1 Éther et piochez 1 carte.',
  },
  {
    god: 'neptune', code: 'NEP-04', nameRecto: 'Lichas', nameVerso: 'Ecueil',
    type: 'mineral', cost: 11, etherProduction: 0,
    effectPermanent: 'Au moment de la génération d\'Éther (début du cycle), génère 1 Éther par mortel minéral métamorphosé en jeu.',
    comment: 'La production d\'Éther est dynamique, calculée au début de chaque cycle.',
  },
  {
    god: 'neptune', code: 'NEP-05', nameRecto: 'Cygnus', nameVerso: 'Cygne',
    type: 'animal', cost: 7, etherProduction: 1,
    effectPermanent: 'Payez 6 Éther : piochez 1 carte puis défaussez 2. Ensuite vous pouvez lever une incapacité.',
  },
  {
    god: 'neptune', code: 'NEP-06', nameRecto: 'Daphné', nameVerso: 'Laurier',
    type: 'vegetal', cost: 8, etherProduction: 1,
    effectPermanent: 'Une fois par tour, vous pouvez défausser une réaction pour faire défausser à un dieu une réaction.',
    comment: 'Le joueur clique sur Laurier pour activer l\'effet. Une fenêtre montre ses deux réactions et propose de cliquer sur celle à défausser ou Annuler. Puis il clique sur une réaction d\'un dieu ennemi.',
  },
  {
    god: 'neptune', code: 'NEP-07', nameRecto: 'Scylla', nameVerso: 'Monstre marin',
    type: 'animal', cost: 16, etherProduction: 0,
    effectOnMetamorphose: 'Retirez du jeu un mortel déjà métamorphosé.',
  },
  {
    god: 'neptune', code: 'NEP-08', nameRecto: 'Périclymène', nameVerso: 'Aigle',
    type: 'animal', cost: 10, etherProduction: 0,
    effectOnMetamorphose: 'Détruisez 4 Éther.',
    effectPermanent: 'Quand vous piochez en dehors de la phase de pioche, générez 1 Éther.',
    comment: 'Pour détruire l\'Éther, cliquer sur les réservoirs. Quand on pioche plusieurs cartes grâce au même effet, on ne génère qu\'un seul Éther.',
  },
  {
    god: 'neptune', code: 'NEP-09', nameRecto: 'Cénis', nameVerso: 'Cénée',
    type: 'animal', cost: 5, etherProduction: 1,
    effectPermanent: 'Si un effet devait rétromorphoser un de vos mortels, vous pouvez rétromorphoser Cénée à la place.',
    comment: 'Alerte pour Neptune si un effet ennemi essaye de rétromorphoser un mortel ET que Cénée est métamorphosé. Fenêtre : "[nom du mortel ciblé] est sur le point d\'être rétromorphosé. Souhaitez-vous rétromorphoser Cénée à la place ?" OUI / NON.',
  },
  {
    god: 'neptune', code: 'NEP-10', nameRecto: 'Ino et Mélicerte', nameVerso: 'Leucothée et Palémon',
    type: 'animal', cost: 16, etherProduction: 1,
    effectPermanent: 'Quand vous métamorphosez un mortel, piochez 1 carte. Pendant votre tour, vous pouvez défausser 7 cartes pour incapaciter un mortel.',
    comment: 'Le joueur clique sur Leucothée et Palémon pour activer l\'effet de défausse. Fenêtre : cliquer sur les 7 cartes ou Annuler. Puis cliquer sur le mortel à incapaciter.',
  },
  // === Cérès ===
  {
    god: 'ceres', code: 'CER-01', nameRecto: 'Lyncus', nameVerso: 'Lynx',
    type: 'animal', cost: 20, etherProduction: 1,
    effectPermanent: 'Rétromorphosez Lyncus : rétromorphosez un mortel ennemi.',
    comment: 'Le joueur clique sur Lyncus pour activer. Fenêtre : "rétromorphoser Lyncus" ou "Annuler". Si confirmé, Lyncus est rétromorphosé et le joueur clique sur le mortel ennemi à rétromorphoser.',
  },
  {
    god: 'ceres', code: 'CER-02', nameRecto: 'Les compagnons de Macarée', nameVerso: 'Bêtes sauvages',
    type: 'animal', cost: 21, etherProduction: 0,
    effectPermanent: 'Génère 1 Éther par mortel de type Animal non-incapacité que vous possédez.',
    comment: 'La production d\'Éther est dynamique, calculée au début de chaque cycle.',
  },
  {
    god: 'ceres', code: 'CER-03', nameRecto: 'Ascalaphus', nameVerso: 'Hiboux',
    type: 'animal', cost: 6, etherProduction: 1,
    effectOnMetamorphose: 'Piochez 2 cartes puis défaussez 1 carte.',
  },
  {
    god: 'ceres', code: 'CER-04', nameRecto: 'Cyané', nameVerso: 'Lac',
    type: 'mineral', cost: 15, etherProduction: 0,
    effectPermanent: 'Vos mortels végétaux génèrent 1 Éther de plus au moment de la génération.',
  },
  {
    god: 'ceres', code: 'CER-05', nameRecto: 'Enfant de la maison de chaume', nameVerso: 'Monstre de Gila',
    type: 'animal', cost: 9, etherProduction: 1,
    effectOnMetamorphose: 'Vous pouvez payer un multiple de 3 Éther pour que chaque dieu ennemi défausse autant de cartes.',
    comment: 'Fenêtre avec compteur. À côté : "X 3 = __ Éther". Le joueur clique "Payer", puis chaque dieu ennemi sélectionne les cartes à défausser et clique "Défausser". Si un dieu n\'a pas assez de cartes, il défausse toutes celles qu\'il a.',
  },
  {
    god: 'ceres', code: 'CER-06', nameRecto: 'Fourmillière', nameVerso: 'Myrmidons',
    type: 'animal', cost: 8, etherProduction: 1,
    effectPermanent: 'Quand un mortel est rétromorphosé, génère 2 Éther.',
  },
  {
    god: 'ceres', code: 'CER-07', nameRecto: 'Arbre aux fruits blancs', nameVerso: 'Arbre aux fruits noirs',
    type: 'vegetal', cost: 6, etherProduction: 0,
    effectPermanent: 'Payez 9 : Levez une incapacité. Payez 14 : Incapacitez un mortel.',
    comment: 'Le joueur clique sur l\'Arbre aux fruits noirs. Fenêtre : "Levez une incapacité", "Incapacitez", "Annuler". Puis cliquer sur le mortel à cibler, l\'Éther est payé.',
  },
  {
    god: 'ceres', code: 'CER-08', nameRecto: 'Dryope', nameVerso: 'Arbre de Lotus',
    type: 'vegetal', cost: 3, etherProduction: 1,
  },
  {
    god: 'ceres', code: 'CER-09', nameRecto: 'Picus', nameVerso: 'Pivert',
    type: 'animal', cost: 6, etherProduction: 1,
    effectOnMetamorphose: 'Un dieu ne piochera pas au début de son prochain tour.',
  },
  {
    god: 'ceres', code: 'CER-10', nameRecto: 'Cadavre de Leucothée', nameVerso: 'Encens',
    type: 'vegetal', cost: 8, etherProduction: 1,
    effectPermanent: 'Rétromorphosez l\'Encens pour mettre la dernière carte de la défausse dans votre main.',
    comment: 'Le joueur clique sur l\'Encens. Fenêtre : "Rétromorphoser pour récupérer [nom de la dernière carte de la défausse]" ou "Annuler".',
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
        id: `mortal-${god}-${i}-${generateUUID().slice(0, 6)}`,
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
