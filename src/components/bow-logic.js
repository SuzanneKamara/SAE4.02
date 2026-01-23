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
    
    // Créer le laser visuel pour le VR
    this.createLaserBeam()
    
    // Créer le viseur pour viser
    this.createCrosshair()
    
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

  createLaserBeam: function() {
    // Créer plusieurs sphères espacées pour créer un laser visible
    const laserGroup = document.createElement('a-entity')
    laserGroup.setAttribute('id', 'laser-group')
    laserGroup.setAttribute('position', '0 0 0')
    laserGroup.setAttribute('rotation', '0 0 0')
    
    // Créer 20 GROSSES sphères espacées le long de l'axe Y négatif
    this.laserSpheres = []
    for (let i = 0; i < 20; i++) {
      const sphere = document.createElement('a-sphere')
      sphere.setAttribute('radius', '0.15')  // Plus grosses
      sphere.setAttribute('color', '#00ff00')
      sphere.setAttribute('position', `0 -${i * 0.3} 0`)  // Axe Y négatif
      sphere.setAttribute('material', 'shader: flat; emissive: #00ff00; emissiveIntensity: 3.0; side: double')
      sphere.setAttribute('visible', 'true')
      laserGroup.appendChild(sphere)
      this.laserSpheres.push(sphere)
    }
    
    // ÉNORME sphère de début JAUNE
    const startSphere = document.createElement('a-sphere')
    startSphere.setAttribute('id', 'ray-start')
    startSphere.setAttribute('radius', '0.3')
    startSphere.setAttribute('color', '#ffff00')
    startSphere.setAttribute('position', '0 0 0')
    startSphere.setAttribute('material', 'shader: flat; emissive: #ffff00; emissiveIntensity: 3.0; side: double')
    startSphere.setAttribute('visible', 'true')
    laserGroup.appendChild(startSphere)
    
    // ÉNORME sphère de fin ROUGE
    const endSphere = document.createElement('a-sphere')
    endSphere.setAttribute('id', 'ray-end')
    endSphere.setAttribute('radius', '0.4')
    endSphere.setAttribute('color', '#ff0000')
    endSphere.setAttribute('position', '0 -6 0')
    endSphere.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3.0; side: double')
    endSphere.setAttribute('visible', 'true')
    laserGroup.appendChild(endSphere)
    
    this.el.appendChild(laserGroup)
    this.laserGroup = laserGroup
    this.startSphere = startSphere
    this.endSphere = endSphere
    
    console.log('✅ LASER avec 20 GROSSES sphères créé')
  },

  createCrosshair: function() {
    // Créer un viseur attaché à la caméra
    const camera = document.querySelector('[camera]')
    if (!camera) {
      console.warn('Caméra non trouvée pour le viseur')
      return
    }
    
    // Groupe pour le viseur
    const crosshairGroup = document.createElement('a-entity')
    crosshairGroup.setAttribute('id', 'crosshair-group')
    crosshairGroup.setAttribute('position', '0 0 -2')  // 2m devant la caméra
    
    // Cercle extérieur du viseur
    const outerRing = document.createElement('a-ring')
    outerRing.setAttribute('id', 'crosshair-outer')
    outerRing.setAttribute('radius-inner', '0.04')
    outerRing.setAttribute('radius-outer', '0.05')
    outerRing.setAttribute('color', '#00ff00')
    outerRing.setAttribute('material', 'shader: flat; opacity: 0.8; transparent: true')
    crosshairGroup.appendChild(outerRing)
    
    // Point central du viseur
    const centerDot = document.createElement('a-circle')
    centerDot.setAttribute('id', 'crosshair-center')
    centerDot.setAttribute('radius', '0.01')
    centerDot.setAttribute('color', '#ff0000')
    centerDot.setAttribute('material', 'shader: flat; opacity: 1.0')
    crosshairGroup.appendChild(centerDot)
    
    // Lignes horizontales et verticales
    const lineH = document.createElement('a-plane')
    lineH.setAttribute('width', '0.1')
    lineH.setAttribute('height', '0.005')
    lineH.setAttribute('color', '#00ff00')
    lineH.setAttribute('material', 'shader: flat; opacity: 0.8; transparent: true')
    crosshairGroup.appendChild(lineH)
    
    const lineV = document.createElement('a-plane')
    lineV.setAttribute('width', '0.005')
    lineV.setAttribute('height', '0.1')
    lineV.setAttribute('color', '#00ff00')
    lineV.setAttribute('material', 'shader: flat; opacity: 0.8; transparent: true')
    crosshairGroup.appendChild(lineV)
    
    camera.appendChild(crosshairGroup)
    this.crosshairGroup = crosshairGroup
    this.crosshairOuter = outerRing
    this.crosshairCenter = centerDot
    
    console.log('✅ Viseur créé et attaché à la caméra')
  },

  updateCrosshair: function() {
    if (!this.crosshairOuter) return
    
    // Changer la couleur du viseur selon si on vise une cible
    const scene = this.el.sceneEl
    const camera = scene.camera
    
    if (!camera) return
    
    // Créer un raycast depuis la caméra
    const raycaster = new THREE.Raycaster()
    const cameraPos = new THREE.Vector3()
    const cameraQuat = new THREE.Quaternion()
    
    camera.getWorldPosition(cameraPos)
    camera.getWorldQuaternion(cameraQuat)
    
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(cameraQuat)
    
    raycaster.set(cameraPos, forward)
    
    // Vérifier si on vise une cible
    const targets = Array.from(scene.querySelectorAll('[target-behavior]'))
    
    if (targets.length > 0) {
      const targetObjects = targets.map(t => t.object3D)
      const intersects = raycaster.intersectObjects(targetObjects, true)
      
      if (intersects.length > 0) {
        // Viseur ROUGE quand on vise une cible
        this.crosshairOuter.setAttribute('color', '#ff0000')
        this.crosshairCenter.setAttribute('color', '#ffff00')
      } else {
        // Viseur VERT quand on ne vise rien
        this.crosshairOuter.setAttribute('color', '#00ff00')
        this.crosshairCenter.setAttribute('color', '#ff0000')
      }
    }
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

  updateLaserBeam: function() {
    if (!this.laserSpheres) return
    
    try {
      // Calculer le raycast pour voir si on vise une cible
      const handPos = this.el.object3D.getWorldPosition(new THREE.Vector3())
      const handRot = this.el.object3D.getWorldQuaternion(new THREE.Quaternion())
      
      const forward = new THREE.Vector3(0, -1, 0)  // Demi-tour: axe Y négatif
      forward.applyQuaternion(handRot)
      
      this.raycaster.set(handPos, forward)
      
      // Vérifier si on vise une cible
      const scene = this.el.sceneEl
      const allEntities = scene.querySelectorAll('[target-behavior]')
      const targets = Array.from(allEntities)
      
      let laserLength = 10
      let laserColor = '#00ff00' // Vert par défaut
      
      if (targets.length > 0) {
        const targetObjects = targets.map(t => t.object3D)
        const intersects = this.raycaster.intersectObjects(targetObjects, true)
        
        if (intersects.length > 0) {
          // On vise une cible - laser rouge et s'arrête à la cible
          laserLength = intersects[0].distance
          laserColor = '#ff0000' // Rouge
        }
      }
      
      // Mettre à jour toutes les sphères du laser
      const numSpheres = Math.min(this.laserSpheres.length, Math.ceil(laserLength))
      for (let i = 0; i < this.laserSpheres.length; i++) {
        if (i < numSpheres) {
          const y = -(i * laserLength / this.laserSpheres.length)  // Axe Y négatif
          this.laserSpheres[i].setAttribute('position', `0 ${y} 0`)
          this.laserSpheres[i].setAttribute('color', laserColor)
          this.laserSpheres[i].setAttribute('material', `shader: flat; emissive: ${laserColor}; emissiveIntensity: 2.0`)
          this.laserSpheres[i].setAttribute('visible', 'true')
        } else {
          this.laserSpheres[i].setAttribute('visible', 'false')
        }
      }
      
      // Mettre à jour la sphère de fin
      if (this.endSphere) {
        this.endSphere.setAttribute('position', `0 -${laserLength} 0`)  // Axe Y négatif
        this.endSphere.setAttribute('color', laserColor)
        this.endSphere.setAttribute('material', `shader: flat; emissive: ${laserColor}; emissiveIntensity: 2.0`)
      }
    } catch (e) {
      // Ignorer les erreurs pour ne pas spammer la console
    }
  },

  tick: function() {
    // Vérifier les gamepads WebXR/VR
    const gamepads = navigator.getGamepads()
    
    // Update laser beam direction
    this.updateLaserBeam()
    
    // Update crosshair color
    this.updateCrosshair()
    
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
    
    // Essayer TOUS les gamepads SANS restriction de hand
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i]
      if (!gamepad) continue
      
      // Log tous les gamepads actifs
      if (!this.lastGamepadState[i]) {
        this.addLog(`📍 Gamepad ${i}: ${gamepad.id}`)
        this.lastGamepadState[i] = true
      }

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
      let axisValue = 0
      for (let a = 0; a < gamepad.axes.length; a++) {
        if (Math.abs(gamepad.axes[a]) > 0.5) {
          axisActive = true
          axisValue = gamepad.axes[a]
          break
        }
      }
      
      // Update debug info
      if (pressedButton) {
        document.getElementById('debug-trigger').textContent = `Button ${buttonIndex}: ON ✓ (${pressedButton.value.toFixed(2)})`
      } else {
        document.getElementById('debug-trigger').textContent = `Buttons: OFF`
      }
      
      if (axisActive) {
        document.getElementById('debug-thumbstick').textContent = `Axes: ACTIVE ✓ (${axisValue.toFixed(2)})`
      } else {
        document.getElementById('debug-thumbstick').textContent = `Axes: OFF`
      }

      // Déclencher le tir si BOUTON OU AXE activé
      // Ne pas vérifier la main, just tirer avec n'importe quel input
      if (pressedButton || axisActive) {
        if (!this.triggerPressed) {
          this.triggerPressed = true
          this.addLog(`🎯 Input détecté: Button ${buttonIndex} ou Axis!`)
          console.log(`🎮 Gamepad ${i} - Button/Axis activation detected`)
          this.shootArrow()
        }
      } else {
        this.triggerPressed = false
      }
    }
  },

  shootArrow: function () {
    console.log('🏹 shootArrow() CALLED - Bow is on:', this.el.id)
    this.addLog('🏹 shootArrow() appelé')
    
    try {
      // Jouer le son de tir
      try {
        const shootSound = document.getElementById('shoot-sound')
        if (shootSound) {
          shootSound.currentTime = 0
          shootSound.play().catch(e => console.log('Son de tir non disponible:', e))
          this.addLog('🔊 Son de tir joué')
        } else {
          this.addLog('❌ shoot-sound element not found')
        }
      } catch (e) {
        console.error('Shoot sound error:', e)
      }

      // Vérifier que l'arc existe
      if (!this.el.object3D) {
        this.addLog('❌ Bow object3D not found')
        console.error('Bow object3D not found')
        return
      }

      const handPos = this.el.object3D.getWorldPosition(new THREE.Vector3())
      const handRot = this.el.object3D.getWorldQuaternion(new THREE.Quaternion())
      
      if (!handPos || !handRot) {
        this.addLog('❌ Hand position/rotation undefined')
        return
      }
      
      console.log('🏹 Tir VR déclenché', { handPos, handRot })
      this.addLog(`📍 Position: ${handPos.x.toFixed(2)}, ${handPos.y.toFixed(2)}, ${handPos.z.toFixed(2)}`)
      
      // Calculer la direction de tir (vers l'avant de la main)
      const forward = new THREE.Vector3(0, -1, 0)  // Demi-tour: axe Y négatif
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
      
      this.addLog(`🔍 Raycast intersections: ${intersects.length}`)
      
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
          this.addLog('✓ Cible touchée et points ajoutés!')
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
    // Jouer le son de tir
    try {
      const shootSound = document.getElementById('shoot-sound')
      if (shootSound) {
        shootSound.currentTime = 0
        shootSound.play().catch(e => console.log('Son de tir non disponible:', e))
      }
    } catch (e) {
      console.error('Shoot sound error:', e)
    }

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
      if (targetEntity && targetEntity.components && targetEntity.components['target-behavior']) {
        const impactPoint = intersects[0].point
        targetEntity.components['target-behavior'].onArrowHit(null, impactPoint)
        console.log('💥 Cible touchée (souris)!')
      }
    } else {
      console.log('❌ Pas de cible en ligne de mire')
    }
  },

  remove: function () {
    // Cleanup si nécessaire
    document.removeEventListener('click', this.shootArrowMouse)
  }
})
