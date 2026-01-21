/**
 * Composant target-behavior pour A-Frame
 * Gère les HP, le calcul de précision basé sur la distance au centre
 * et les animations de hit/destruction
 */

AFRAME.registerComponent('target-behavior', {
  schema: {
    points: { type: 'number', default: 10 },
    hp: { type: 'number', default: 1 },
    movable: { type: 'boolean', default: false },
    centerRadius: { type: 'number', default: 0.1 }, // Rayon du centre (bullseye)
    middleRadius: { type: 'number', default: 0.3 }, // Rayon moyen
    outerRadius: { type: 'number', default: 0.5 }   // Rayon extérieur
  },

  init: function () {
    this.currentHp = this.data.hp
    this.hitCount = 0
    
    // Animation de mouvement si activé
    if (this.data.movable) {
      this.setupMovement()
    }

    console.log(`🎯 Cible créée: ${this.data.points} points, ${this.data.hp} HP`)
  },

  /**
   * Méthode appelée quand une flèche touche la cible
   * Calcule le score de précision basé sur la distance au centre
   */
  onArrowHit: function (arrowEl, impactPoint) {
    this.hitCount++
    this.currentHp--

    // Convertir le point d'impact en coordonnées locales de la cible
    const localImpact = this.el.object3D.worldToLocal(impactPoint.clone())
    
    // Calculer la distance au centre (sur le plan XY local)
    const distanceToCenter = Math.sqrt(
      localImpact.x * localImpact.x + 
      localImpact.y * localImpact.y
    )

    // Calculer le multiplicateur de précision
    let precisionMultiplier = 1.0
    let hitZone = 'outer'
    
    if (distanceToCenter <= this.data.centerRadius) {
      precisionMultiplier = 3.0 // Bullseye! x3
      hitZone = 'bullseye'
    } else if (distanceToCenter <= this.data.middleRadius) {
      precisionMultiplier = 2.0 // Zone moyenne x2
      hitZone = 'middle'
    } else if (distanceToCenter <= this.data.outerRadius) {
      precisionMultiplier = 1.0 // Zone extérieure x1
      hitZone = 'outer'
    } else {
      precisionMultiplier = 0.5 // Touché le bord x0.5
      hitZone = 'edge'
    }

    const finalPoints = Math.floor(this.data.points * precisionMultiplier)

    console.log(`💥 Cible touchée! Zone: ${hitZone} | Distance: ${distanceToCenter.toFixed(3)}m | Points: ${finalPoints} | HP restants: ${this.currentHp}`)

    // Animations de feedback
    this.playHitAnimation(hitZone)
    this.showHitFeedback(localImpact, finalPoints, hitZone)

    // Émettre un événement de score au système de jeu
    this.el.sceneEl.emit('target-hit', {
      points: finalPoints,
      zone: hitZone,
      multiplier: precisionMultiplier,
      position: this.el.object3D.position,
      distanceToCenter: distanceToCenter
    })

    // Détruire la cible si HP = 0
    if (this.currentHp <= 0) {
      this.destroy(finalPoints)
    }
  },

  playHitAnimation: function (zone) {
    // Animation de pulsation selon la zone touchée
    let scaleTo = '1.1 1.1 1.1'
    let color = '#FFFF00'
    
    if (zone === 'bullseye') {
      scaleTo = '1.3 1.3 1.3'
      color = '#FFD700' // Or
    } else if (zone === 'middle') {
      scaleTo = '1.2 1.2 1.2'
      color = '#FFA500' // Orange
    }

    this.el.setAttribute('animation__hit', {
      property: 'scale',
      to: scaleTo,
      dur: 150,
      dir: 'alternate',
      easing: 'easeInOutQuad'
    })

    // Flash de couleur sur tous les cylindres enfants
    const cylinders = this.el.querySelectorAll('[geometry="primitive: cylinder"]')
    cylinders.forEach((cyl, index) => {
      cyl.setAttribute(`animation__color${index}`, {
        property: 'material.color',
        to: color,
        dur: 200,
        dir: 'alternate'
      })
    })
  },

  showHitFeedback: function (localPosition, points, zone) {
    // Créer un texte flottant avec les points
    const feedback = document.createElement('a-text')
    const worldPos = this.el.object3D.localToWorld(localPosition.clone())
    
    let text = `+${points}`
    let color = '#FFFF00'
    
    if (zone === 'bullseye') {
      text = `🎯 +${points}!`
      color = '#FFD700'
    } else if (zone === 'middle') {
      text = `+${points}`
      color = '#FFA500'
    }
    
    feedback.setAttribute('value', text)
    feedback.setAttribute('position', `${worldPos.x} ${worldPos.y + 0.3} ${worldPos.z}`)
    feedback.setAttribute('align', 'center')
    feedback.setAttribute('color', color)
    feedback.setAttribute('width', '2')
    feedback.setAttribute('animation', {
      property: 'position',
      to: `${worldPos.x} ${worldPos.y + 0.8} ${worldPos.z}`,
      dur: 1000,
      easing: 'easeOutQuad'
    })
    feedback.setAttribute('animation__fade', {
      property: 'material.opacity',
      from: 1,
      to: 0,
      dur: 1000,
      easing: 'easeInQuad'
    })
    
    this.el.sceneEl.appendChild(feedback)
    
    // Supprimer après l'animation
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback)
      }
    }, 1100)
  },

  destroy: function (lastPoints) {
    console.log('🎉 Cible détruite!')
    
    // Animation de destruction
    this.el.setAttribute('animation__destroy', {
      property: 'scale',
      to: '0 0 0',
      dur: 400,
      easing: 'easeInQuad'
    })

    // Rotation pendant la destruction
    this.el.setAttribute('animation__spin', {
      property: 'rotation',
      to: '0 360 0',
      dur: 400,
      easing: 'easeInQuad'
    })

    // Émettre événement de destruction
    this.el.sceneEl.emit('target-destroyed', {
      points: this.data.points,
      totalHits: this.hitCount,
      bonusPoints: Math.floor(lastPoints * 0.5)
    })

    // Supprimer après l'animation
    setTimeout(() => {
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el)
      }
    }, 450)
  },

  setupMovement: function () {
    // Mouvement oscillant pour les cibles mobiles
    const randomOffset = Math.random() * Math.PI * 2
    const basePos = this.el.getAttribute('position')
    
    this.el.setAttribute('animation__move', {
      property: 'position',
      to: `${basePos.x + Math.sin(randomOffset) * 1.5} ${basePos.y + Math.cos(randomOffset) * 0.5} ${basePos.z + Math.sin(randomOffset * 0.5) * 1}`,
      dur: 4000,
      dir: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    })
    
    console.log('🎯 Cible mobile activée')
  }
})
