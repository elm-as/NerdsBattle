# NerdsBattle

Application web mobile-first de quiz éducatif gamifié pour collégiens, lycéens et étudiants du supérieur.
Pensée comme un mix Duolingo × Mimo × LeetCode.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS** (dark mode `class`)
- **React Router**
- **Lucide** icons (zéro emoji)
- **PWA** via `vite-plugin-pwa`
- **Supabase** — auth (email + Discord), DB PostgreSQL, Edge Functions
- **DeepSeek API** — génération de cours par IA (via Edge Function)
- **KaTeX** — rendu des formules mathématiques
- État local : `localStorage` (fallback offline) + Supabase (persistance cloud)

## Démarrage

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # lance la suite de tests unitaires Vitest
npm run build     # bundle production PWA optimisé (< 700 ko / chunk)
npm run preview
```

## Structure

```
src/
  data/
    subjects.js          # registre des matières (icones lucide)
    levels.js            # niveaux scolaires (6e → Tle)
    countries.js         # pays supportés (ISO)
    courses/             # contenu pédagogique en JSON
      <subjectId>/
        <levelId>/
          <slug>.json    # un cours = une leçon + N questions
      _SCHEMA.md         # documentation du format
  lib/
    contentLoader.js     # charge JSON statiques + cours Supabase
    quizEngine.js        # check, score, révision, défi
    storage.js           # persistance localStorage (fallback offline)
    leaderboard.js       # mock déterministe (à remplacer par vue Supabase)
    supabase.js          # client Supabase (null si pas de .env)
  context/
    ThemeContext.jsx     # dark/light persistant
    UserContext.jsx      # user, history, XP, streak (localStorage)
    AuthContext.jsx      # session Supabase, profil cloud
  components/
    ui/                  # Button, Card, ProgressBar, Tabs, Badge
    layout/              # AppShell, TopBar, BottomNav, ThemeToggle
    quiz/                # QuestionRenderer, Timer, Confetti
  pages/
    Login, Onboarding, Home, Explore, CourseDetail, Quiz, Results, Leaderboards, Profile
  router.jsx
  App.jsx
  main.jsx
  index.css
supabase/
  migrations/001_initial_schema.sql   # tables profiles, quiz_history, courses + RLS
  functions/generate-course/index.ts  # Edge Function DeepSeek proxy
```

## Ajouter un cours sans toucher au code

1. Crée un fichier `src/data/courses/<subjectId>/<levelId>/<slug>.json`
   (ex : `src/data/courses/maths/troisieme/equations.json`).
2. Respecte le format documenté dans `src/data/courses/_SCHEMA.md`.
3. Le loader détecte le fichier au prochain rebuild — **aucune autre modif**.

`subjectId` doit exister dans `src/data/subjects.js`.
`levelId` doit exister dans `src/data/levels.js`.

## Types de questions supportés

- `mcq` — choix multiples (`options[]`, `answer: number`)
- `truefalse` — vrai/faux (`answer: boolean`)
- `fill` — texte à trous (`answer: string`, comparaison normalisée)

## Classements

Strictement séparés par niveau (un 6e ne croise jamais un Tle).
Quatre scopes : Monde, Pays, Matière, Niveau.
Mock déterministe pour l'instant — voir `src/lib/leaderboard.js`.

## Variables d'environnement

Copier `.env.example` → `.env` :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Sans `.env`, l'app tourne en mode offline (localStorage uniquement).

## Déployer l'Edge Function

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase secrets set DEEPSEEK_API_KEY=sk-...
npx supabase functions deploy generate-course
```

## Roadmap

- [x] Auth email/password + Discord OAuth
- [x] Backend Supabase (auth, DB, Edge Function)
- [x] Génération de cours par IA (DeepSeek)
- [x] Rendu KaTeX pour les formules
- [ ] Classements temps réel via vue Supabase
- [ ] Difficulté adaptative
- [ ] Mode multijoueur 1v1 temps réel
- [ ] Back-office d'édition de cours
