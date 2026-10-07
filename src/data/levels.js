// Niveaux scolaires. Strictement séparés dans les classements (par `id`).
// Pour ajouter un niveau : pousser une entrée ici, puis créer les dossiers
// `src/data/courses/<subjectId>/<levelId>/` correspondants.

export const LEVELS = [
  // Collège
  { id: 'sixieme',   name: '6ème',             short: '6e',     order: 1,  cycle: 'college'   },
  { id: 'cinquieme', name: '5ème',             short: '5e',     order: 2,  cycle: 'college'   },
  { id: 'quatrieme', name: '4ème',             short: '4e',     order: 3,  cycle: 'college'   },
  { id: 'troisieme', name: '3ème',             short: '3e',     order: 4,  cycle: 'college'   },

  // Lycée
  { id: 'seconde',   name: 'Seconde',          short: '2nde',   order: 5,  cycle: 'lycee'     },
  { id: 'premiere',  name: 'Première',         short: '1re',    order: 6,  cycle: 'lycee'     },
  { id: 'terminale', name: 'Terminale',        short: 'Tle',    order: 7,  cycle: 'lycee'     },

  // Prépa (cycle séparé — niveau hors-norme vs L1/L2)
  { id: 'prepa1',    name: 'Prépa 1ère année', short: 'MP/PC',  order: 8,  cycle: 'prepa'     },
  { id: 'prepa2',    name: 'Prépa 2ème année', short: 'MP*/PC*', order: 9, cycle: 'prepa'     },

  // Supérieur
  { id: 'licence1',  name: 'Licence 1',        short: 'L1',     order: 10, cycle: 'superieur' },
  { id: 'licence2',  name: 'Licence 2',        short: 'L2',     order: 11, cycle: 'superieur' },
  { id: 'licence3',  name: 'Licence 3',        short: 'L3',     order: 12, cycle: 'superieur' },
  { id: 'master1',   name: 'Master 1',         short: 'M1',     order: 13, cycle: 'superieur' },
  { id: 'master2',   name: 'Master 2',         short: 'M2',     order: 14, cycle: 'superieur' }
]

export const CYCLES = [
  { id: 'college',   name: 'Collège',    color: 'from-sky-500 to-blue-500'      },
  { id: 'lycee',     name: 'Lycée',      color: 'from-emerald-500 to-teal-500'  },
  { id: 'prepa',     name: 'Prépa',      color: 'from-orange-500 to-red-500'    },
  { id: 'superieur', name: 'Supérieur',  color: 'from-violet-500 to-purple-500' }
]

export const getLevel = (id) => LEVELS.find((l) => l.id === id)
export const getCycle = (id) => CYCLES.find((c) => c.id === id)
export const getLevelsByCycle = (cycle) =>
  LEVELS.filter((l) => l.cycle === cycle).sort((a, b) => a.order - b.order)
