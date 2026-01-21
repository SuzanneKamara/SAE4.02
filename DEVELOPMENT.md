# Configuration Vite pour A-Frame et WebXR

Ce projet utilise Vite avec A-Frame pour créer une expérience de tir à l'arc en réalité étendue.

## Structure du Projet

```
src/
├── components/          # Composants A-Frame personnalisés
│   ├── bow.js          # Mécanique de l'arc
│   ├── arrow-physics.js # Physique des flèches
│   └── target.js       # Système de cibles
├── game/               # Logique de jeu
│   └── ScoreManager.js # Gestion du score et des combos
├── main.js             # Point d'entrée
└── style.css           # Styles CSS
```

## Composants Développés

### 🏹 Bow Component
- Gestion de la tension de l'arc
- Détection des contrôleurs VR
- Tir de flèches avec physique

### ➡️ Arrow Physics Component
- Simulation de gravité réaliste
- Trajectoire balistique
- Détection de collision
- Durée de vie limitée

### 🎯 Target Component
- Système de points de vie (HP)
- Cibles statiques et mobiles
- Animations de hit et destruction
- Émission d'événements de score

### 📊 Score Manager
- Système de combo
- Multiplicateur progressif
- Affichage HUD en temps réel
- Statistiques de jeu

## Commandes de Développement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Builder pour la production
npm run build

# Prévisualiser le build
npm run preview
```

## Technologies Utilisées

- **Vite** : Build tool ultra-rapide
- **A-Frame** : Framework WebXR
- **Three.js** : Moteur 3D (inclus dans A-Frame)
- **WebXR API** : Support natif VR/AR

## Prochaines Étapes

- [ ] Implémenter le Scene Mesh pour ancrage spatial
- [ ] Ajouter des power-ups (flèches explosives, multi-cibles)
- [ ] Créer des modes de jeu (entraînement, défi, contre-la-montre)
- [ ] Améliorer les effets visuels et sonores
- [ ] Optimiser les performances VR
- [ ] Ajouter un système de niveaux/progression

## Déploiement

Le projet peut être déployé sur n'importe quel hébergement statique :
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

```bash
npm run build
# Les fichiers de production seront dans le dossier dist/
```
