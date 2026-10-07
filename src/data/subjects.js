// Registre des matières — source de vérité.
// L'`id` doit matcher le nom du dossier dans `src/data/courses/<id>/`.
// Pour ajouter une matière : créer le dossier puis pousser une entrée ici.
import { 
  Sigma, FlaskConical, Microscope, ScrollText, 
  Globe, Terminal, BookMarked, Brain, 
  MessageCircle, Building2
} from 'lucide-react'

export const SUBJECTS = [
  { id: 'maths',       name: 'Mathématiques',   shortName: 'Maths',     icon: Sigma,         color: 'from-emerald-500 to-lime-500'  },
  { id: 'physique',    name: 'Physique-Chimie', shortName: 'PC',        icon: FlaskConical,  color: 'from-sky-500 to-indigo-500'    },
  { id: 'svt',         name: 'SVT',             shortName: 'SVT',       icon: Microscope,    color: 'from-green-500 to-teal-500'    },
  { id: 'histoire',    name: 'Histoire-Géo',    shortName: 'HG',        icon: ScrollText,    color: 'from-amber-500 to-orange-500'  },
  { id: 'anglais',     name: 'Anglais',         shortName: 'Anglais',   icon: Globe,         color: 'from-rose-500 to-pink-500'     },
  { id: 'info',        name: 'Informatique',    shortName: 'Info',      icon: Terminal,      color: 'from-violet-500 to-fuchsia-500'},
  { id: 'francais',    name: 'Français',        shortName: 'Français',  icon: BookMarked,    color: 'from-yellow-500 to-amber-500'  },
  { id: 'philosophie', name: 'Philosophie',     shortName: 'Philo',     icon: Brain,         color: 'from-purple-500 to-violet-500' },
  { id: 'espagnol',    name: 'Espagnol',        shortName: 'Espagnol',  icon: MessageCircle, color: 'from-red-500 to-rose-500'      },
  { id: 'allemand',    name: 'Allemand',        shortName: 'Allemand',  icon: Building2,     color: 'from-slate-500 to-zinc-500'    },
  { id: 'culture_generale', name: 'Culture Générale', shortName: 'Culture G', icon: Globe,   color: 'from-amber-500 to-rose-500'    },
]

export const getSubject = (id) => SUBJECTS.find((s) => s.id === id)