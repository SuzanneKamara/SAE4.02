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
    this.triggerPressed = false
    this.lastGamepadState = {}
    
    // Écouteurs d'événements pour les contrôleurs VR
    this.el.addEventListener('triggerdown', this.shootArrow.bind(this))
    this.el.addEventListener('trigger-start', this.shootArrow.bind(this))
    this.el.addEventListener('xbuttondown', this.shootArrow.bind(this))
    this.el.addEventListener('abuttondown', this.shootArrow.bind(this))
    
    // Écouteur pour la souris
    document.addEventListener('click', this.shootArrowMouse.bind(this))
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    })
    
    console.log('🏹 Composant bow-logic initialisé (tir VR + souris)')
    this.addLog('✓ bow-logic initialisé')
  },

  addLog: function(msg) {
    const errorList = document.getElementById('error-list')
    if (errorList) {
      const div = document.createElement('div')
      div.textContent = msg
      div.style.color = msg.includes('✓') ? '#0f0' : '#f0f'
      errorList.appendChild(div)
      // Garder les 15 derniers messages
      while (errorList.children.length > 15) {
        errorList.removeChild(errorList.firstChild)
      }
    }
  },

  tick: function() {
    // Vérifier les gamepads WebXR/VR
    const gamepads = navigator.getGamepads()
    
    // Update debug panel
    const debugPanel = document.getElementById('debug-panel')
    if (!debugPanel) return
    
    if (!gamepads) {
      document.getElementById('debug-gamepad').textContent = 'Gamepads: NOT AVAILABLE'
      return
    }
    
    // Afficher le nombre de gamepads
    const connectedGamepads = Array.from(gamepads).filter(g => g !== null)
    document.getElementById('debug-gamepad').textContent = `Gamepads: ${connectedGamepads.length} connectés`
    
    // Essayer TOUS les gamepads
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i]
      if (!gamepad) continue
      
      // Log tous les gamepads actifs
      if (!this.lastGamepadState[i]) {
        this.addLog(`📍 Gamepad ${i}: ${gamepad.id}`)
        this.lastGamepadState[i] = true
      }

      // Chercher la main gauche
      const isLeftHand = (i === 0 || i === 2) && this.el.id === 'leftHand'
      const isRightHand = (i === 1 || i === 3) && this.el.id === 'rightHand'

      if (!isLeftHand && !isRightHand) continue

      // Vérifier TOUS les boutons disponibles
      let pressedButton = null
      let buttonIndex = -1
      
      for (let b = 0; b < gamepad.buttons.length; b++) {
        const button = gamepad.buttons[b]
        if (button && button.pressed) {
          pressedButton = button
          buttonIndex = b
          break
        }
      }
      
      // Vérifier les axes (joysticks)
      let axisActive = false
      for (let a = 0; a < gamepad.axes.length; a++) {
        if (Math.abs(gamepad.axes[a]) > 0.5) {
          axisActive = true
          break
        }
      }
      
      // Update debug info
      if (pressedButton) {
        document.getElementById('debug-trigger').textContent = `Button ${buttonIndex}: ON ✓`
      } else {
        document.getElementById('debug-trigger').textContent = `Buttons: OFF`
      }
      
      document.getElementById('debug-thumbstick').textContent = `Axes: ${axisActive ? 'ACTIVE ✓' : 'OFF'}`

      // Déclencher le tir
      if (pressedButton || axisActive) {
        if (!this.triggerPressed) {
          this.triggerPressed = true
          this.addLog(`🎯 Button/Axis input detected!`)
          this.shootArrow()
        }
      } else {
        this.triggerPressed = false
      }
    }
  },

  shootArrow: function () {
    this.addLog('🏹 shootArrow() appelé')
    
    try {
      const handPos = this.el.object3D.getWorldPosition(new THREE.Vector3())
      const handRot = this.el.object3D.getWorldQuaternion(new THREE.Quaternion())
      
      if (!handPos || !handRot) {
        this.addLog('❌ Hand position/rotation undefined')
        return
      }
      
      console.log('🏹 Tir VR déclenché', { handPos, handRot })
      
      // Calculer la direction de tir (vers l'avant de la main)
      const forward = new THREE.Vector3(0, 0, -1)
      forward.applyQuaternion(handRot)
      
      // Créer un raycaster
      this.raycaster.set(handPos, forward)
      
      // Détecter les cibles
      const scene = this.el.sceneEl
      if (!scene) {
        this.addLog('❌ Scene not found')
        return
      }
      
      const allEntities = scene.querySelectorAll('[target-behavior]')
      const targets = Array.from(allEntities)
      
      // Update debug panel
      const targetsEl = document.getElementById('debug-targets')
      if (targetsEl) targetsEl.textContent = `Targets: ${targets.length}`
      
      if (targets.length === 0) {
        console.log('❌ Aucune cible détectée')
        const raycastEl = document.getElementById('debug-raycast')
        if (raycastEl) raycastEl.textContent = 'Raycast: NO TARGETS'
        this.addLog('❌ Aucune cible trouvée')
        return
      }
      
      this.addLog(`🎯 ${targets.length} cibles détectées`)
      
      // Intersections avec les cibles
      const targetObjects = targets.map(t => t.object3D)
      const intersects = this.raycaster.intersectObjects(targetObjects, true)
      
      if (intersects.length > 0) {
        this.addLog(`✓ Raycast hit: ${intersects.length} intersection(s)`)
        
        // Première cible touchée
        const hitObject = intersects[0].object
        let targetEntity = null
        
        // Trouver l'entité A-Frame correspondante en cherchant le parent
        for (let target of targets) {
          let current = hitObject
          let depth = 0
          while (current && depth < 20) {
            if (current === target.object3D) {
              targetEntity = target
              break
            }
            current = current.parent
            depth++
          }
          if (targetEntity) break
        }
        
        // Fallback: chercher par proximité
        if (!targetEntity) {
          this.addLog('⚠️ Using fallback target')
          targetEntity = targets[0]
        }
        
        // Appeler le système de dommage de la cible
        if (targetEntity) {
          if (!targetEntity.components) {
            this.addLog('❌ Target has no components')
            return
          }
          
          if (!targetEntity.components['target-behavior']) {
            this.addLog('❌ Target missing target-behavior component')
            return
          }
          
          const impactPoint = intersects[0].point
          targetEntity.components['target-behavior'].onArrowHit(null, impactPoint)
          console.log('💥 Cible touchée!')
          const raycastEl = document.getElementById('debug-raycast')
          if (raycastEl) raycastEl.textContent = 'Raycast: HIT ✓'
          this.addLog('✓ Cible touchée!')
        } else {
          this.addLog('❌ Could not find target entity')
        }
      } else {
        console.log('❌ Pas de cible en ligne de mire')
        const raycastEl = document.getElementById('debug-raycast')
        if (raycastEl) raycastEl.textContent = 'Raycast: NO HIT'
        this.addLog('❌ Pas de cible en ligne')
      }
      
      // Feedback haptique désactivé (non supporté de manière fiable)
      // Utiliser le son et les animations visuelles à la place
    } catch (e) {
      console.error('shootArrow error:', e)
      this.addLog(`❌ shootArrow exception: ${e.message}`)
    }
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
