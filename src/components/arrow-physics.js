/**
 * Composant physique pour les flèches
 * Simule la gravité et la trajectoire réaliste
 */

AFRAME.registerComponent('arrow-physics', {
  schema: {
    speed: { type: 'number', default: 10 },
    gravity: { type: 'number', default: 9.81 }
  },

  init: function () {
    this.velocity = new THREE.Vector3()
    this.acceleration = new THREE.Vector3(0, -this.data.gravity, 0)
    
    // Direction initiale basée sur la rotation
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.el.object3D.quaternion)
    this.velocity.copy(direction.multiplyScalar(this.data.speed))
    
    this.lifetime = 0
    this.maxLifetime = 10000 // 10 secondes max
    
    console.log('➡️ Physique de flèche activée')
  },

  tick: function (time, deltaTime) {
    const dt = deltaTime / 1000
    this.lifetime += deltaTime

    // Supprimer la flèche après un certain temps
    if (this.lifetime > this.maxLifetime) {
      this.el.parentNode.removeChild(this.el)
      return
    }

    // Appliquer la gravité
    this.velocity.add(this.acceleration.clone().multiplyScalar(dt))

    // Mettre à jour la position
    const displacement = this.velocity.clone().multiplyScalar(dt)
    const currentPosition = this.el.object3D.position
    this.el.object3D.position.add(displacement)

    // Orienter la flèche dans la direction du mouvement
    const direction = this.velocity.clone().normalize()
    this.el.object3D.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    )

    // Détection de collision (simplifiée)
    this.checkCollision()
  },

  checkCollision: function () {
    const position = this.el.object3D.position
    
    // Collision avec le sol
    if (position.y < 0) {
      console.log('💥 Flèche touchée le sol')
      this.el.parentNode.removeChild(this.el)
      return
    }

    // Ici, on pourrait ajouter la détection de collision avec les cibles
    // en utilisant un raycaster ou la détection de proximité
  }
})
