/**
 * Gestionnaire de score et de gameplay
 */

export class ScoreManager {
  constructor() {
    this.score = 0
    this.combo = 0
    this.maxCombo = 0
    this.multiplier = 1.0
    this.lastHitTime = 0
    this.comboTimeout = 2000 // 2 secondes pour maintenir le combo
    
    this.initEventListeners()
  }

  initEventListeners() {
    const scene = document.querySelector('a-scene')
    
    scene.addEventListener('target-hit', (evt) => {
      this.onTargetHit(evt.detail)
    })

    scene.addEventListener('target-destroyed', (evt) => {
      this.onTargetDestroyed(evt.detail)
    })
  }

  onTargetHit(data) {
    const now = Date.now()
    
    // Vérifier si le combo continue
    if (now - this.lastHitTime < this.comboTimeout) {
      this.combo++
      this.multiplier = 1 + (this.combo * 0.1) // +10% par combo
    } else {
      this.combo = 1
      this.multiplier = 1.0
    }

    this.lastHitTime = now
    this.maxCombo = Math.max(this.maxCombo, this.combo)

    // Calculer les points
    const points = Math.floor(data.points * this.multiplier)
    this.score += points

    console.log(`🎯 Score: ${this.score} | Combo: x${this.combo} | Multiplicateur: ${this.multiplier.toFixed(1)}x`)
    
    // Afficher le score (UI)
    this.updateScoreDisplay()
  }

  onTargetDestroyed(data) {
    const bonusPoints = Math.floor(data.points * 0.5)
    this.score += bonusPoints
    console.log(`🎉 Bonus de destruction: +${bonusPoints}`)
    this.updateScoreDisplay()
  }

  updateScoreDisplay() {
    // Créer ou mettre à jour l'affichage du score
    let scoreDisplay = document.querySelector('.hud-overlay')
    
    if (!scoreDisplay) {
      scoreDisplay = document.createElement('div')
      scoreDisplay.className = 'hud-overlay'
      document.body.appendChild(scoreDisplay)
    }

    scoreDisplay.innerHTML = `
      <div class="score">Score: ${this.score}</div>
      <div>Combo: x${this.combo}</div>
      <div>Multiplicateur: ${this.multiplier.toFixed(1)}x</div>
      <div>Meilleur combo: x${this.maxCombo}</div>
    `
  }

  reset() {
    this.score = 0
    this.combo = 0
    this.maxCombo = 0
    this.multiplier = 1.0
    this.updateScoreDisplay()
    console.log('🔄 Score réinitialisé')
  }

  getStats() {
    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      multiplier: this.multiplier
    }
  }
}
