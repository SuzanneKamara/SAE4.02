/**
 * Composant bow-logic pour A-Frame
 * Calcule la tension de l'arc basée sur la distance entre les deux manettes VR
 * Utilise aframe-physics-system avec Ammo.js pour le tir réaliste
 */

AFRAME.registerComponent('bow-logic', {
  schema: {
    maxTension: { type: 'number', default: 1.5 },
    minDistance: { type: 'number', default: 0.1 },
    maxDistance: { type: 'number', default: 0.6 },
    arrowSpeed: { type: 'number', default: 25 }
  },

  init: function () {
    this.tension = 0
    this.isDrawing = false
    this.otherHand = null
    this.stringVisualization = null
    
    // Attendre que les deux contrôleurs soient chargés
    setTimeout(() => {
      this.otherHand = document.querySelector('#leftHand')
      this.createStringVisualization()
    }, 500)

    // Écouteurs d'événements pour les contrôleurs VR
    this.el.addEventListener('triggerdown', this.startDrawing.bind(this))
    this.el.addEventListener('triggerup', this.releaseArrow.bind(this))
    this.el.addEventListener('gripdown', this.startDrawing.bind(this))
    this.el.addEventListener('gripup', this.releaseArrow.bind(this))
    
    console.log('🏹 Composant bow-logic initialisé (basé sur distance entre manettes)')
  },

  createStringVisualization: function () {
    // Créer une ligne pour représenter la corde de l'arc
    this.stringVisualization = document.createElement('a-entity')
    this.stringVisualization.setAttribute('line', {
      start: '0 0 0',
      end: '0 0 0',
      color: '#8B4513',
      opacity: 0.8
    })
    this.el.sceneEl.appendChild(this.stringVisualization)
  },

  startDrawing: function () {
    if (!this.otherHand) return
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

  calculateTension: function () {
    if (!this.otherHand || !this.isDrawing) {
      this.tension = 0
      return
    }

    // Calculer la distance entre les deux manettes
    const pos1 = this.el.object3D.getWorldPosition(new THREE.Vector3())
    const pos2 = this.otherHand.object3D.getWorldPosition(new THREE.Vector3())
    const distance = pos1.distanceTo(pos2)

    // Mapper la distance à la tension (0 à 1)
    const normalizedDistance = Math.max(0, Math.min(1, 
      (distance - this.data.minDistance) / (this.data.maxDistance - this.data.minDistance)
    ))

    this.tension = normalizedDistance * this.data.maxTension

    // Mettre à jour la visualisation de la corde
    if (this.stringVisualization && this.isDrawing) {
      const localPos = this.el.object3D.worldToLocal(pos2.clone())
      this.stringVisualization.setAttribute('line', {
        start: `${pos1.x} ${pos1.y} ${pos1.z}`,
        end: `${pos2.x} ${pos2.y} ${pos2.z}`,
        opacity: 0.5 + (this.tension * 0.5)
      })
    }
  },

  shootArrow: function () {
    const scene = this.el.sceneEl
    const handPos = this.el.object3D.getWorldPosition(new THREE.Vector3())
    const handRot = this.el.object3D.getWorldQuaternion(new THREE.Quaternion())

    // Créer une flèche avec physique Ammo.js
    const arrow = document.createElement('a-entity')
    
    // Géométrie de la flèche
    arrow.setAttribute('geometry', {
      primitive: 'cylinder',
      radius: 0.015,
      height: 0.8
    })
    arrow.setAttribute('material', { 
      color: '#8B4513',
      metalness: 0.3
    })
    
    // Position et rotation initiales
    arrow.object3D.position.copy(handPos)
    arrow.object3D.quaternion.copy(handRot)
    
    // Ajout du corps physique dynamique
    arrow.setAttribute('dynamic-body', {
      shape: 'cylinder',
      mass: 0.05,
      linearDamping: 0.1,
      angularDamping: 0.3
    })
    
    // Composant personnalisé pour la physique de la flèche
    arrow.setAttribute('arrow-physics', {
      tension: this.tension,
      speed: this.data.arrowSpeed
    })

    scene.appendChild(arrow)
    
    // Feedback haptique
    if (this.el.components['oculus-touch-controls']) {
      this.el.components['oculus-touch-controls'].pulse(0.5, 100)
    }
    
    console.log(`🎯 Flèche tirée! Tension: ${this.tension.toFixed(2)} | Vitesse: ${(this.data.arrowSpeed * this.tension).toFixed(1)} m/s`)
    
    // Émettre un événement
    scene.emit('arrow-shot', { tension: this.tension, position: handPos })
  },

  tick: function (time, deltaTime) {
    if (this.isDrawing) {
      this.calculateTension()
    } else if (this.stringVisualization) {
      // Masquer la corde quand on ne tire pas
      this.stringVisualization.setAttribute('line', { opacity: 0 })
    }
  },

  remove: function () {
    if (this.stringVisualization) {
      this.stringVisualization.parentNode.removeChild(this.stringVisualization)
    }
  }
})
