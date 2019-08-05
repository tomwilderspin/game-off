import Phaser from 'phaser'

import BootScene from './scenes/Boot'
import SplashScene from './scenes/Splash'
import GameScene from './scenes/Game'

import config from './config'

const gameConfig = Object.assign(config, {
  scene: [BootScene, SplashScene, GameScene]
})

class Game extends Phaser.Game {
  constructor () {
    super(gameConfig)
  }
}
let context
window.onload = () => {
  context = new AudioContext()
}

document.getElementById('start').onclick = () => {
  context.resume().then(() => {
    window.game = new Game()
    document.getElementById('start').style.display = 'none'
  })
}
