# Analyse du Système NerdsBattle

## 1. Système de Recommandations (Home.jsx)

### Fonctionnement actuel
```javascript
const courses = getCourses({ levelId: user?.levelId })
const recommended = courses.slice(0, 4)  // Les 4 premiers cours du niveau
```

**Problème** : Aucune intelligence - prend juste les 4 premiers cours du niveau de l'utilisateur.

### Améliorations proposées

1. **Par popularité** : Cours les plus joués par les pairs
2. **Par progression** : Cours non commencés ou non terminés
3. **Par sujets faibles** : Détecter les erreurs fréquentes et proposer des cours ciblés
4. **Par streak** : Cours pour maintenir la série quotidienne
5. **Par niveau de difficulté** : Adapter selon le taux de réussite
6. **Algorithme hybride** :
   - 40% : Cours non commencés du niveau
   - 30% : Cours recommandés selon erreurs passées
   - 20% : Cours populaires
   - 10% : Cours aléatoires pour découvertes

---

## 2. Système de Compétition

### 2.1 Modes de jeu

| Mode | Joueurs | Questions | Timer | Particularité |
|------|---------|-----------|-------|---------------|
| **Solo** | 1 | 8 (IA) | 20s/q | Entraînement classique |
| **Blitz** | 1 | 8 (IA) | 10s/q | Plus rapide, bonus vitesse |
| **1v1** | 2 | 8 (IA) | 20s/q | Real-time vs adversaire |
| **2v2** | 4 (2 équipes) | 8 (IA) | 20s/q | Coopératif |

### 2.2 Logique de fin de partie

#### Actuellement (BattleQuiz.jsx)

**Déclencheurs de fin** :
1. Joueur répond à la dernière question → `finishGame()`
2. Temps écoulé sur une question → `handleAnswer(null, false)` + avance
3. Adversaire termine (event 'finished') → `finishGame(false, ...)`

**Problèmes identifiés** :
- ❌ Pas d'auto-submit global si un joueur quitte
- ❌ Pas de timeout global (partie peut durer indéfiniment)
- ❌ Les réponses vides (temps écoulé) comptent comme "faux" mais pas explicitement marquées
- ❌ Pas de mode "tous les joueurs doivent répondre"

#### Améliorations proposées

**Option A : Premier termine = partie finie** (actuel)
- ✅ Déjà implémenté
- ⚠️ Avantage au joueur rapide

**Option B : Timeout global**
```javascript
// Après 5 min max, la partie se termine automatiquement
const GAME_MAX_DURATION = 5 * 60 * 1000;
```

**Option C : Attendre tous les joueurs**
```javascript
// Mode "Fair" : tous les joueurs doivent répondre à toutes les questions
// Si un joueur quitte, ses réponses restantes = 0 points
```

**Option D : Tour par tour (synchrone)**
- Tous les joueurs voient la même question en même temps
- Timer synchronisé
- Révélation des réponses après que tous ont répondu ou timer écoulé

---

## 3. Système de Corrections (Results.jsx)

### Fonctionnement actuel

Affiche après le quiz :
- Score total
- XP gagné
- Détail question par question :
  - Énoncé
  - Réponse utilisateur (vert si bon, rouge si faux)
  - Bonne réponse (si erreur)

### Améliorations proposées

1. **Explications** : Pourquoi c'est la bonne réponse
2. **Ressources liées** : Liens vers le cours correspondant
3. **Statistiques de la question** : % de réussite globale
4. **Filtres** : Voir uniquement les erreurs
5. **Mode "Révision"** : Refaire uniquement les questions ratées
6. **Partage** : Partager son score/correction

---

## 4. Architecture Technique

### Flow d'une partie 1v1

```
1. Matchmaking.jsx
   └── Recherche de room Supabase Realtime
   └── Génération questions IA (Edge Function)
   └── Countdown 3-2-1

2. BattleQuiz.jsx  
   └── Chargement questions (sessionStorage)
   └── Timer 20s par question
   └── handleAnswer() → broadcast score
   └── finishGame() quand dernière question
   └── Mise à jour DB game_rooms

3. Results.jsx
   └── Affichage score + corrections détaillées
   └── Calcul XP + rang
```

### Points critiques

- **Real-time** : Supabase Broadcast pour scores adversaire
- **Persistence** : sessionStorage pour questions (pas de DB)
- **Génération IA** : Edge Function `generate-questions` (Gemini)
- **Calcul des points** : `Math.max(10, timeLeft)` pour bonus vitesse

---

## 5. Recommandations d'amélioration prioritaires

### 🔴 Critique
1. Timeout global sur les parties (éviter les parties bloquées)
2. Gestion des déconnexions (reconnexion possible)

### 🟡 Important  
3. Système de recommandations intelligent
4. Explications dans les corrections
5. Mode tour par tour synchronisé

### 🟢 Nice to have
6. Statistiques détaillées par cours/matière
7. Système de défis entre amis
8. Classements hebdomadaires avec récompenses
