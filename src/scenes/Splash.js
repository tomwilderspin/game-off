import Phaser from 'phaser'

export default class extends Phaser.Scene {
  constructor () {
    super({ key: 'SplashScene' })
  }

  preload () {
    //
    // load your assets
    //
    this.load.image('pitch', 'assets/graphics/pitch.png')
    this.load.spritesheet('ball',
      'assets/graphics/ball_frames.png',
      { frameWidth: 44, frameHeight: 44 }
    )
    this.load.spritesheet(
      'paddle-left',
      'assets/graphics/pud_left.png',
      { frameWidth: 50, frameHeight: 100 }
    )
    this.load.spritesheet(
      'paddle-right',
      'assets/graphics/pud_right.png',
      { frameWidth: 50, frameHeight: 100 }
    )
  }

  create () {
    this.scene.start('GameScene')
  }

  update () {}
}
