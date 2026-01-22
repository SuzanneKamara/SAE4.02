/**
 * Composant bow-logic pour A-Frame
 * Gère le tir à la gâchette de la manette VR
 * Utilise un raycast pour détecter les cibles
 */

AFRAME.registerComponent('bow-logic', {
  schema: {
    arrowSpeed: { type: 'number', default: 25 }
  },

  init: function () {
    this.raycaster = new THREE.Raycaster()
    this.shootDirection = new THREE.Vector3()
    this.mouse = new THREE.Vector2()
    
    // Écouteurs d'événements pour les contrôleurs VR
    // Gâchette (trigger) pour le tir
    this.el.addEventListener('triggerdown', this.shootArrow.bind(this))
    
    // Aussi accepter la gâchette des autres APIs
    this.el.addEventListener('xbuttondown', this.shootArrow.bind(this))
    
    // Écouteur pour la souris
    document.addEventListener('click', this.shootArrowMouse.bind(this))
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    })
    
    console.log('🏹 Composant bow-logic initialisé (tir à la gâchette + souris)')
  },

  shootArrow: function () {
    const handPos = this.el.object3D.getWorldPosition(new THREE.Vector3())
    const handRot = this.el.object3D.getWorldQuaternion(new THREE.Quaternion())
    
    // Calculer la direction de tir (vers l'avant de la main)
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(handRot)
    
    // Créer un raycaster
    this.raycaster.set(handPos, forward)
    
    // Détecter les cibles
    const scene = this.el.sceneEl
    const allEntities = scene.querySelectorAll('[target-behavior]')
    const targets = Array.from(allEntities)
    
    if (targets.length === 0) {
      console.log('❌ Aucune cible détectée')
      return
    }
    
    // Intersections avec les cibles
    const intersects = this.raycaster.intersectObjects(
      targets.map(t => t.object3D),
      true
    )
    
    if (intersects.length > 0) {
      // Première cible touchée
      const hitObject = intersects[0].object
      let targetEntity = null
      
      // Trouver l'entité A-Frame correspondante en cherchant le parent
      for (let target of targets) {
        let current = hitObject
        while (current) {
          if (current === target.object3D) {
            targetEntity = target
            break
          }
          current = current.parent
        }
        if (targetEntity) break
      }
      
      // Fallback: chercher par proximité
      if (!targetEntity) {
        targetEntity = targets[0]
      }
      
      // Appeler le système de dommage de la cible
      if (targetEntity.components['target-behavior']) {
        const impactPoint = intersects[0].point
        targetEntity.components['target-behavior'].onArrowHit(null, impactPoint)
        console.log('💥 Cible touchée!')
      }
    } else {
      console.log('❌ Pas de cible en ligne de mire')
    }
    
    // Feedback haptique (optionnel)
    if (this.el.components['oculus-touch-controls']) {
      this.el.components['oculus-touch-controls'].pulse(0.5, 100)
    }
    
    console.log('🏹 Tir déclenché')
  },

  shootArrowMouse: function () {
    const camera = this.el.sceneEl.camera
    const scene = this.el.sceneEl
    
    // Utiliser la position de la souris pour le raycast
    this.raycaster.setFromCamera(this.mouse, camera)
    
    // Détecter les cibles
    const allEntities = scene.querySelectorAll('[target-behavior]')
    const targets = Array.from(allEntities)
    
    if (targets.length === 0) {
      console.log('❌ Aucune cible détectée')
      return
    }
    
    // Intersections avec les cibles
    const intersects = this.raycaster.intersectObjects(
      targets.map(t => t.object3D),
      true
    )
    
    if (intersects.length > 0) {
      // Première cible touchée
      const hitObject = intersects[0].object
      let targetEntity = null
      
      // Trouver l'entité A-Frame correspondante en cherchant le parent
      for (let target of targets) {
        let current = hitObject
        while (current) {
          if (current === target.object3D) {
            targetEntity = target
            break
          }
          current = current.parent
        }
        if (targetEntity) break
      }
      
      // Fallback: chercher par proximité
      if (!targetEntity) {
        targetEntity = targets[0]
      }
      
      // Appeler le système de dommage de la cible
      if (targetEntity.components['target-behavior']) {
        const impactPoint = intersects[0].point
        targetEntity.components['target-behavior'].onArrowHit(null, impactPoint)
        console.log('💥 Cible touchée (souris)!')
      }
    } else {
      console.log('❌ Pas de cible en ligne de mire')
    }
    
    console.log('🏹 Tir à la souris déclenché')
  },

  remove: function () {
    // Cleanup si nécessaire
    document.removeEventListener('click', this.shootArrowMouse)
  }
})
