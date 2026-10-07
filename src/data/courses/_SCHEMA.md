# Schéma d'un cours

Chemin : `src/data/courses/<subjectId>/<levelId>/<slug>.json`

- `subjectId` doit exister dans `src/data/subjects.js`
- `levelId` doit exister dans `src/data/levels.js`

Le loader (`src/lib/contentLoader.js`) lit automatiquement tous les `*.json`
de ce dossier via `import.meta.glob` — **aucune modif de code requise pour ajouter un cours**.

## Format JSON

```json
{
  "id": "maths-sixieme-operations-base",
  "title": "Les opérations de base",
  "summary": "Addition, soustraction, multiplication, division.",
  "lesson": "Texte de cours en markdown léger…",
  "estimatedMinutes": 8,
  "tags": ["arithmétique", "calcul"],
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "prompt": "Combien font 7 × 8 ?",
      "options": ["54", "56", "64", "48"],
      "answer": 1,
      "explanation": "7 × 8 = 56 (table de 8)."
    },
    {
      "id": "q2",
      "type": "truefalse",
      "prompt": "12 + 9 = 21",
      "answer": true,
      "explanation": "Calcul direct."
    },
    {
      "id": "q3",
      "type": "fill",
      "prompt": "5 × ___ = 45",
      "answer": "9",
      "explanation": "45 / 5 = 9."
    }
  ]
}
```

## Types de questions supportés

- `mcq` : `options: string[]`, `answer: number` (index 0-based)
- `truefalse` : `answer: boolean`
- `fill` : `answer: string` (comparaison normalisée : trim + lowercase + accents)

`subjectId` et `levelId` sont **inférés du chemin** par le loader, pas besoin de les répéter dans le JSON.
