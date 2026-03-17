# GOLEM.EXE — Idle Auto-Battler
## Tâche 1 — Moteur de base

### Structure de fichiers

```
idle-autobattler/
├── index.html          ← App complète (moteur + UI)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (cache offline)
├── icon-192.png        ← (à générer)
├── icon-512.png        ← (à générer)
└── README.md
```

---

### Architecture du moteur

#### State Management (inline Zustand-style)
```js
state = {
  golem: { col, row, hp, mp, xp, stats... },
  enemies: [...],
  particles: [...],
  inventory: [...],
  wave: 1,
}
```

#### Rendu Isométrique
- Grille 18×18 tiles converties via `ISO.toScreen(col, row)`
- Depth-sorting par `col + row` pour le z-order correct
- Pixel-art SVG-like via Canvas 2D drawing (pas de textures)
- Checkerboard de tiles sombres/claires pour la profondeur

#### Machine à États du Golem
```
patrol ──(ennemis proches)──► chase
chase  ──(à portée)──────────► attack
attack ──(HP < 30% + menace)──► flee
flee   ──(menace disparaît)──► patrol
```

#### Comportement de Survie
- **Threat score** : somme des `threat` des ennemis dans un rayon de 4 tuiles
- **Fuite** déclenchée si HP < 30% ET threat ≥ 3
- **Stratégie** : fuite si threat > 4, même si HP est OK
- **Centrage** : lors de la fuite, légère attraction vers le centre de la carte
- **Régénération passive** en patrol et en fuite (HP)

#### Système de Vagues
- Chaque vague scale le HP/DMG des ennemis : `1 + wave * 0.08`
- Spawn sur les 4 bords de la carte
- Délai de 5s entre les vagues

#### PWA
- `manifest.json` : standalone, landscape, thème cyan sur fond noir
- `sw.js` : cache-first local, network-first pour fonts Google
- Background Sync ready pour sauvegardes hors-ligne
- Push Notifications ready pour alertes de vagues

---

### Prochaines tâches
- **Tâche 2** : Système de sorts complet (parchemins, cooldowns, effets visuels)
- **Tâche 3** : Équipement avec stats dynamiques et comparaison
- **Tâche 4** : Upgrade tree + Idle progression (gold → améliorations)
- **Tâche 5** : Son (Web Audio API) + effets de caméra (shake)
