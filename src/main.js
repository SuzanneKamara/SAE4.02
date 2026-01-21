import './style.css'
import 'aframe'
import 'aframe-environment-component'

// Import des composants personnalisés
import './components/bow.js'
import './components/arrow-physics.js'
import './components/target.js'

// Import du gestionnaire de jeu
import { ScoreManager } from './game/ScoreManager.js'

// Initialiser le gestionnaire de score
let scoreManager

document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene')
  
  scene.addEventListener('loaded', () => {
    console.log('🏹 SAE 4.02 - Archery XR initialisé')
    console.log('WebXR ready - Utilisez un casque VR pour une expérience immersive')
    
    // Initialiser le score manager
    scoreManager = new ScoreManager()
    
    // Afficher les instructions
    showInstructions()
  })
})

function showInstructions() {
  const instructions = document.createElement('div')
  instructions.className = 'instructions'
  instructions.innerHTML = `
    <strong>🎯 Instructions</strong><br>
    Desktop: Cliquez sur les cibles<br>
    VR: Utilisez les contrôleurs pour tirer
  `
  document.body.appendChild(instructions)
  
  // Masquer après 5 secondes
  setTimeout(() => {
    instructions.style.opacity = '0'
    instructions.style.transition = 'opacity 1s'
    setTimeout(() => instructions.remove(), 1000)
  }, 5000)
}

// Exposer le score manager globalement pour debug
window.scoreManager = scoreManager
