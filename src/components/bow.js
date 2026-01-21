/**
 * Composant Arc pour A-Frame
 * Gère la mécanique de tir à l'arc avec tension et relâche
 */

AFRAME.registerComponent('bow', {
  schema: {
    maxTension: { type: 'number', default: 1.0 },
    arrowSpeed: { type: 'number', default: 20 }
  },

  init: function () {
    this.tension = 0
    this.isDrawing = false
    this.controller = this.el

    // Écouteurs d'événements pour les contrôleurs VR
    this.controller.addEventListener('triggerdown', this.startDrawing.bind(this))
    this.controller.addEventListener('triggerup', this.releaseArrow.bind(this))
    
    console.log('🏹 Composant Arc initialisé')
  },

  startDrawing: function () {
    this.isDrawing = true
    console.log('🎯 Début de la tension de l\'arc')
  },

  releaseArrow: function () {
    if (this.isDrawing && this.tension > 0.2) {
      this.shootArrow()
    }
    this.isDrawing = false
    this.tension = 0
  },

  shootArrow: function () {
    const scene = this.el.sceneEl
    const camera = scene.querySelector('[camera]')
    const position = camera.object3D.position
    const rotation = camera.object3D.rotation

    // Créer une flèche
    const arrow = document.createElement('a-entity')
    arrow.setAttribute('geometry', {
      primitive: 'cylinder',
      radius: 0.02,
      height: 0.8
    })
    arrow.setAttribute('material', { color: '#8B4513' })
    arrow.setAttribute('position', `${position.x} ${position.y} ${position.z}`)
    arrow.setAttribute('rotation', `${rotation.x * 180 / Math.PI} ${rotation.y * 180 / Math.PI} ${rotation.z * 180 / Math.PI}`)
    arrow.setAttribute('arrow-physics', {
      speed: this.data.arrowSpeed * this.tension
    })

    scene.appendChild(arrow)
    
    console.log(`🎯 Flèche tirée avec tension: ${this.tension.toFixed(2)}`)
  },

  tick: function (time, deltaTime) {
    if (this.isDrawing && this.tension < this.data.maxTension) {
      this.tension += deltaTime / 1000 // Augmente la tension progressivement
    }
  }
})
