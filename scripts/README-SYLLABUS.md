# 📚 Syllabus & Génération de Cours

Ce dossier contient les outils pour générer automatiquement des cours basés sur le syllabus complet du programme scolaire français.

## 📖 Le Syllabus

Le fichier `src/data/syllabus.js` définit **tous les thèmes** par matière et niveau :

- **Maths** : 6ème → Prépa 2ème année (60+ cours)
- **Physique** : Seconde → Terminale (20+ cours)
- **SVT** : Seconde → Terminale (20+ cours)
- **Histoire** : Seconde → Terminale (15+ cours)
- **Philosophie** : Terminale uniquement (13 cours)
- **Langues** : Anglais, Espagnol, Allemand
- **Français** : Première, Terminale
- **Info** : Seconde → Prépa (20+ cours)

**Total : ~200 cours planifiés**

---

## 🛠️ Scripts disponibles

### 1. `syllabus-status.mjs` - Voir l'état actuel

```bash
# Vue d'ensemble
node scripts/syllabus-status.mjs

# Voir uniquement les cours manquants
node scripts/syllabus-status.mjs --missing

# Filtrer par matière
node scripts/syllabus-status.mjs --subject maths

# Filtrer par niveau
node scripts/syllabus-status.mjs --level terminale

# Export JSON
node scripts/syllabus-status.mjs --json
```

**Exemple de sortie :**
```
MATHS [██████░░░░] 60% (36/60)
────────────────────────────────────────
   ✅ seconde     8/8
   🔄 premiere    6/9
   ❌ terminale   4/12
   ...
```

---

### 2. `batch-generate.mjs` - Générer en masse

```bash
# Générer 5 cours manquants aléatoires
node scripts/batch-generate.mjs --missing-only --count 5

# Générer tous les cours d'une matière/niveau
node scripts/batch-generate.mjs --subject maths --level terminale

# Générer 3 cours de maths niveau seconde
node scripts/batch-generate.mjs --subject maths --level seconde --count 3

# Générer 10 cours aléatoires du syllabus
node scripts/batch-generate.mjs --count 10

# Mode test (sans appeler l'API)
node scripts/batch-generate.mjs --subject maths --level seconde --dry-run
```

**Prérequis :** Définir la clé API
```powershell
$env:API_KEY="sk-..."
```

---

### 3. `generate-course.mjs` - Générer un cours spécifique

```bash
node scripts/generate-course.mjs maths terminale derivees "Les dérivées"
```

---

## 📁 Structure des cours générés

```
src/data/courses/
├── maths/
│   ├── seconde/
│   │   ├── ensembles-nombres.json
│   │   ├── fonctions-reference.json
│   │   └── ...
│   ├── premiere/
│   │   ├── derivees.json
│   │   └── ...
│   └── terminale/
│       ├── limites-fonctions.json
│       └── ...
├── physique/
│   ├── seconde/
│   ├── premiere/
│   └── terminale/
└── ...
```

---

## 🎯 Workflow recommandé

### 1. Vérifier l'état actuel
```bash
node scripts/syllabus-status.mjs
```

### 2. Générer les cours manquants (par batch de 5)
```bash
# Définir la clé API
$env:API_KEY="sk-..."

# Lancer la génération
node scripts/batch-generate.mjs --missing-only --count 5
```

### 3. Vérifier ce qui a été généré
```bash
node scripts/syllabus-status.mjs
```

### 4. Répéter jusqu'à complétion

---

## 📝 Format du syllabus

```javascript
{
  slug: 'derivees',           // Identifiant unique
  title: 'Les dérivées',      // Titre affiché
  tags: ['analyse', 'calcul'] // Catégories pour filtrage
}
```

---

## 🔧 Personnaliser le syllabus

Pour ajouter un nouveau cours, éditer `src/data/syllabus.js` :

```javascript
maths: {
  terminale: [
    // ... cours existants
    { 
      slug: 'mon-nouveau-cours', 
      title: 'Mon nouveau cours',
      tags: ['tag1', 'tag2']
    }
  ]
}
```

Puis générer :
```bash
node scripts/batch-generate.mjs --subject maths --level terminale --count 1
```

---

## 📊 API Utilisée

Par défaut : **DeepSeek Chat** (configurable via `API_BASE_URL` et `API_MODEL`)

Variables d'environnement :
- `API_KEY` (obligatoire) - Clé API
- `API_BASE_URL` (optionnel) - Défaut: https://api.deepseek.com/v1
- `API_MODEL` (optionnel) - Défaut: deepseek-chat
- `QUESTION_COUNT` (optionnel) - Nombre de questions par cours (défaut: 6)

---

## 🎉 Objectif

**200 cours couvrant tout le programme scolaire français** :
- Collège (6ème → 3ème)
- Lycée (Seconde → Terminale)
- Prépa (MPSI/MP, PCSI/PC, BCPST)
- Licence/Master (Maths, Info)

Chaque cours contient :
- 📖 Leçon théorique
- 📝 6 questions variées (QCM, Vrai/Faux, Texte à trou)
- ✅ Explications détaillées
- ⏱️ Durée estimée (5-15 min)
