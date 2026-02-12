
# Integration des 5 derniers mortels de Bacchus (BAC-06 a BAC-10)

## Fichiers images a copier
10 fichiers depuis user-uploads vers `public/mortals/` avec noms ASCII :
- BAC-06-recto.png, BAC-06-verso.png (Clytie / Tournesol)
- BAC-07-recto.png, BAC-07-verso.png (Battus / Statue de Battus)
- BAC-08-recto.png, BAC-08-verso.png (Les Menades / Arbres)
- BAC-09-recto.png, BAC-09-verso.png (Les trois filles de Mynias / Trois chauves-souris)
- BAC-10-recto.png, BAC-10-verso.png (Arne / Corneille)

## Donnees a ajouter dans `src/data/mortals.ts`
Ajouter 5 templates apres BAC-05 (ligne 151) :

| Code | Recto | Verso | Type | Cout | Ether | Effet |
|------|-------|-------|------|------|-------|-------|
| BAC-06 | Clytie | Tournesol | vegetal | 7 | 1 | Permanent : Si les Arbres et le Tournesol sont metamorphoses, retrometamorphosez : choisissez entre incapaciter un mortel ou lever une incapacite |
| BAC-07 | Battus | Statue de Battus | mineral | 6 | 0 | Permanent : Retrometamorphosez : incapacitez un mortel |
| BAC-08 | Les Menades | Arbres | vegetal | 5 | 1 | Aucun effet permanent |
| BAC-09 | Les trois filles de Mynias | Trois chauves-souris | animal | 9 | 1 | Permanent : Vos sorts coutent 1 de moins a jouer |
| BAC-10 | Arne | Corneille | animal | 6 | 1 | Permanent : Retrometamorphosez : generez 8 Ether |

## Details techniques
- Modification d'un seul fichier : `src/data/mortals.ts` (ajout de 5 entrees dans le tableau `MORTAL_TEMPLATES`)
- Les images compressees permettront de comparer la vitesse de chargement avec les non-compressees
- Bacchus aura alors ses 10 mortels complets, comme Apollon et Venus
