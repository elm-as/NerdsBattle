# Analyse : Système XP vs Système Elo

## 🎯 Résumé des deux systèmes

### 1. Système XP (Progression PvE)
**Rôle** : Récompenser l'engagement et la progression dans les cours

**Sources de gain** :
- Bonnes réponses (10 XP base × multiplicateur niveau)
- Bonus perfect (20 XP)
- Bonus rapidité (12 XP si temps > 50%)
- Bonus streak (8/18/40 XP)
- Bonus victoire battle (15 XP)
- Multiplicateur mode (solo 1x, challenge 1.3x, 1v1 1.5x)

**Utilisation** :
- Classement général (leaderboard)
- Déblocage de rangs cosmétiques
- Stats personnelles
- Système anti-spam (répétition réduit l'XP)

**Stockage** : `profiles.total_xp`

---

### 2. Système Elo (Compétition PvP)
**Rôle** : Classer les joueurs selon leur niveau réel en battle

**Sources de gain/perte** :
- Victoire = +Elo (plus si adversaire fort)
- Défaite = -Elo (moins si adversaire fort)
- Match nul = ±petit changement
- Bonus/Malus selon écart de score

**Utilisation** :
- Matchmaking équilibré
- Classement compétitif
- Détermination du rang skill (Bronze → Légende)

**Stockage** : `profiles.elo` + `profiles.elo_rank`

---

## ⚠️ ANOMALIES DÉTECTÉES

### 1. **UserContext.jsx ne gère pas l'Elo**
**Problème** : 
- Charge `total_xp` depuis Supabase ✅
- Ne charge PAS `elo` depuis Supabase ❌
- Ne met pas à jour l'Elo après un battle ❌

**Conséquence** : L'Elo est calculé mais jamais stocké/affiché dans l'UI

---

### 2. **Double système de victoire**
**Problème** :
- XP donne déjà un bonus `battleWin: 15 XP`
- Elo change aussi sur victoire/défaite

**Solution** : Les deux sont complémentaires
- XP = récompense immédiate de participation
- Elo = classement à long terme

---

### 3. **Stats non réelles**
**Problème** : 
- Les stats affichées (taux de réussite, etc.) sont calculées localement
- Pas d'historique détaillé sur Supabase pour analyse

---

## ✅ CORRECTIONS NÉCESSAIRES

### 1. Intégrer Elo dans UserContext
```javascript
// Charger elo depuis Supabase
user: {
  ...
  elo: supabaseProfile.elo || 1000,
  eloRank: supabaseProfile.elo_rank || 'silver',
  wins: supabaseProfile.wins || 0,
  losses: supabaseProfile.losses || 0
}

// Mettre à jour après battle
if (entry.eloChange !== undefined) {
  await supabase.from('profiles').update({
    elo: entry.newElo,
    wins: entry.won ? profile.wins + 1 : profile.wins,
    losses: !entry.won ? profile.losses + 1 : profile.losses
  })
}
```

### 2. Clarifier l'affichage
- **Profil** : Montrer les deux (XP total + Elo actuel)
- **Battle** : Montrer le changement d'Elo
- **Classement** : Garder XP pour le général, ajouter Elo pour le compétitif

### 3. Migration SQL
- Ajouter colonnes `elo`, `elo_rank`, `wins`, `losses` à `profiles` ✅ Déjà fait
- Créer vue `leaderboard_by_elo` pour classement compétitif

---

## 📊 Distinction claire

| Aspect | XP | Elo |
|--------|-----|-----|
| **But** | Progression générale | Skill compétitif |
| **Gagné par** | Quiz, bonnes réponses | Victoires PvP |
| **Perdu par** | Rien (accumulation) | Défaites PvP |
| **Utilisé pour** | Rangs cosmétiques, déblocage | Matchmaking, classement skill |
| **Comportement** | Toujours croissant | Monte/descend |
| **Stocké dans** | `total_xp` | `elo` |

Les deux systèmes sont **complémentaires**, pas conflictuels.
