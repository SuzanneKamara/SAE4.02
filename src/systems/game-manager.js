/**
 * Système game-manager pour A-Frame
 * Gère le cycle de jeu, le spawn des cibles et le score global
 * Utilise aframe-state-component pour la réactivité
 */

AFRAME.registerSystem('game-manager', {
  schema: {
    spawnInterval: { type: 'number', default: 5000 },
    maxTargets: { type: 'number', default: 5 },
    difficulty: { type: 'string', default: 'normal' }
  },

  init: function () {
    this.initializeGameState()
    this.setupEventListeners()
    this.startGameAfterDelay(2000)
    
    console.log('🎮 Game Manager initialisé')
  },

  initializeGameState: function () {
    this.activeTargets = []
    this.totalScore = 0
    this.totalArrowsShot = 0
    this.totalHits = 0
    this.spawnTimer = null
    this.gameRunning = false
  },

  setupEventListeners: function () {
    this.el.addEventListener('target-hit', this.onTargetHit.bind(this))
    this.el.addEventListener('target-destroyed', this.onTargetDestroyed.bind(this))
    this.el.addEventListener('arrow-shot', this.onArrowShot.bind(this))
  },

  startGameAfterDelay: function (delay) {
    setTimeout(() => this.startGame(), delay)
  },

  startGame: function () {
    if (this.gameRunning) return
    
    this.gameRunning = true
    this.el.setAttribute('state', 'gameStarted', true)
    this.startTargetSpawning()
    this.createScoreDisplay()
    
    console.log('🎮 Jeu démarré!')
  },

  startTargetSpawning: function () {
    this.spawnTimer = setInterval(() => {
      if (this.canSpawnMoreTargets()) {
        this.spawnRandomTarget()
      }
    }, this.data.spawnInterval)
  },

  canSpawnMoreTargets: function () {
    return this.activeTargets.length < this.data.maxTargets
  },

  spawnRandomTarget: function () {
    const target = this.createTargetEntity()
    const config = this.getTargetConfig()
    
    this.configureTarget(target, config)
    this.addTargetGeometry(target, config)
    this.addToScene(target)
    
    console.log(`🎯 Cible spawned: ${target.id} (${config.points}pts, ${config.hp}HP)`)
  },

  createTargetEntity: function () {
    const target = document.createElement('a-entity')
    target.id = `target-${Date.now()}`
    return target
  },

  getTargetConfig: function () {
    const position = this.getRandomPosition()
    const difficulty = this.getDifficultySettings()
    const outerRadius = 0.4 + Math.random() * 0.2
    
    return { ...position, ...difficulty, outerRadius }
  },

  getRandomPosition: function () {
    return {
      x: (Math.random() - 0.5) * 6,
      y: 1 + Math.random() * 2,
      z: -4 - Math.random() * 3
    }
  },

  getDifficultySettings: function () {
    const settings = {
      easy: { points: 10, hp: 1, movable: false },
      normal: { points: 15, hp: Math.random() > 0.7 ? 2 : 1, movable: Math.random() > 0.7 },
      hard: { points: 20, hp: Math.floor(Math.random() * 3) + 1, movable: Math.random() > 0.5 }
    }
    
    return settings[this.data.difficulty] || settings.normal
  },

  configureTarget: function (target, config) {
    target.setAttribute('position', `${config.x} ${config.y} ${config.z}`)
    target.setAttribute('target-behavior', {
      points: config.points,
      hp: config.hp,
      movable: config.movable
    })
  },

  addTargetGeometry: function (target, config) {
    const { outerRadius } = config
    target.innerHTML = `
      <a-cylinder radius="${outerRadius}" height="0.1" color="#FF0000" rotation="90 0 0" static-body></a-cylinder>
      <a-cylinder position="0 0 0.06" radius="${outerRadius * 0.6}" height="0.05" color="#FFFFFF"></a-cylinder>
      <a-cylinder position="0 0 0.11" radius="${outerRadius * 0.3}" height="0.05" color="#FFD700"></a-cylinder>
    `
  },

  addToScene: function (target) {
    this.el.appendChild(target)
    this.activeTargets.push(target)
  },

  onTargetHit: function (evt) {
    const { points, zone } = evt.detail
    
    this.totalHits++
    this.addScore(points)
    this.updateScoreDisplay()
    
    console.log(`📊 Score: ${this.totalScore} (+${points} en ${zone})`)
  },

  onTargetDestroyed: function (evt) {
    const { bonusPoints } = evt.detail
    
    this.removeDestroyedTargets()
    
    if (bonusPoints > 0) {
      this.addScore(bonusPoints)
      console.log(`🎁 Bonus: +${bonusPoints}`)
    }
    
    this.updateScoreDisplay()
  },

  removeDestroyedTargets: function () {
    this.activeTargets = this.activeTargets.filter(t => t.parentNode)
  },

  onArrowShot: function () {
    this.totalArrowsShot++
  },

  addScore: function (points) {
    const currentScore = this.el.getAttribute('state').score || 0
    const newScore = currentScore + points
    this.el.setAttribute('state', 'score', newScore)
    this.totalScore = newScore
  },

  createScoreDisplay: function () {
    const hud = document.createElement('div')
    hud.id = 'game-hud'
    hud.className = 'hud-overlay'
    hud.innerHTML = `
      <div class="score">Score: <span id="score-value">0</span></div>
      <div>Combo: <span id="combo-value">x1</span></div>
      <div>Précision: <span id="accuracy-value">0%</span></div>
      <div>Cibles actives: <span id="targets-value">0</span></div>
    `
    document.body.appendChild(hud)
  },

  updateScoreDisplay: function () {
    this.updateElement('score-value', this.totalScore)
    this.updateElement('targets-value', this.activeTargets.length)
    this.updateAccuracy()
  },

  updateElement: function (id, value) {
    const element = document.getElementById(id)
    if (element) element.textContent = value
  },

  updateAccuracy: function () {
    if (this.totalArrowsShot === 0) return
    
    const accuracy = Math.round((this.totalHits / this.totalArrowsShot) * 100)
    this.updateElement('accuracy-value', `${accuracy}%`)
  },

  stopGame: function () {
    this.gameRunning = false
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer)
      this.spawnTimer = null
    }
    console.log('🎮 Jeu arrêté')
  },

  tick: function (time) {
    if (this.gameRunning && this.shouldUpdateDisplay(time)) {
      this.updateScoreDisplay()
    }
  },

  shouldUpdateDisplay: function (time) {
    return time % 1000 < 16
  }
})
