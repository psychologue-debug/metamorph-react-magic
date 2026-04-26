// Priorités de métamorphose recommandées par mortel.
// 1 = priorité la plus haute (I), 2 = II, 3 = III.
// Les codes correspondent au champ `code` des mortels (ex: 'APO-07').
export const MORTAL_PRIORITIES: Partial<Record<string, 1 | 2 | 3>> = {
  // Apollon
  'APO-07': 1, // Marsyas
  'APO-05': 2, // Niobé
  // Vénus
  'VEN-03': 1, // Égérie
  // Bacchus
  'BAC-09': 1, // Les trois filles de Mynias
  'BAC-02': 2, // Matelots tyrrhéniens
  // Minerve
  'MIN-06': 1, // Dents de serpent
  // Diane
  'DIA-01': 1, // Alcione et Céyx
  'DIA-04': 2, // Cadmus et Harmonie
  'DIA-07': 3, // Callisto et Arcas
  // Neptune
  'NEP-08': 1, // Périclymène
  'NEP-10': 2, // Ino et Mélicerte
  'NEP-03': 3, // Bateaux grecs
  // Cérès : aucune priorité conseillée
};

export const ROMAN: Record<1 | 2 | 3, string> = { 1: 'I', 2: 'II', 3: 'III' };
