/**
 * Composant cible pour A-Frame
 * Gère les points, les hits et les animations
 */

AFRAME.registerComponent('target', {
  schema: {
    points: { type: 'number', default: 10 },
    hp: { type: 'number', default: 1 },
    movable: { type: 'boolean', default: false }
  },

  init: function () {
    this.currentHp = this.data.hp
    this.hitCount = 0
    
    // Rendre la cible interactive
    this.el.classList.add('interactive')
    
    // Écouteur pour les collisions
    this.el.addEventListener('collide', this.onHit.bind(this))
    
    // Animation de mouvement si activé
    if (this.data.movable) {
      this.setupMovement()
    }

    console.log(`🎯 Cible créée: ${this.data.points} points, ${this.data.hp} HP`)
  },

  onHit: function (evt) {
    this.hitCount++
    this.currentHp--

    console.log(`💥 Cible touchée! Points: ${this.data.points}, HP restants: ${this.currentHp}`)

    // Animation de hit
    this.el.setAttribute('animation__hit', {
      property: 'scale',
      to: '1.2 1.2 1.2',
      dur: 150,
      dir: 'alternate',
      easing: 'easeInOutQuad'
    })

    // Effet de couleur
    const originalColor = this.el.getAttribute('material').color
    this.el.setAttribute('animation__color', {
      property: 'material.color',
      to: '#FFFF00',
      dur: 200,
      dir: 'alternate'
    })

    // Émettre un événement de score
    this.el.sceneEl.emit('target-hit', {
      points: this.data.points,
      position: this.el.object3D.position
    })

    // Détruire la cible si HP = 0
    if (this.currentHp <= 0) {
      this.destroy()
    }
  },

  destroy: function () {
    console.log('🎉 Cible détruite!')
    
    // Animation de destruction
    this.el.setAttribute('animation__destroy', {
      property: 'scale',
      to: '0 0 0',
      dur: 300,
      easing: 'easeInQuad'
    })

    // Supprimer après l'animation
    setTimeout(() => {
      this.el.parentNode.removeChild(this.el)
    }, 350)

    // Émettre événement de destruction
    this.el.sceneEl.emit('target-destroyed', {
      points: this.data.points * this.hitCount
    })
  },

  setupMovement: function () {
    // Mouvement oscillant pour les cibles mobiles
    const randomOffset = Math.random() * Math.PI * 2
    this.el.setAttribute('animation__move', {
      property: 'position',
      to: `${Math.sin(randomOffset) * 3} ${1.5 + Math.cos(randomOffset)} ${-5 + Math.sin(randomOffset) * 2}`,
      dur: 4000,
      dir: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    })
  }
})
