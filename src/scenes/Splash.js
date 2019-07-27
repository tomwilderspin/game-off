import Phaser from 'phaser'
import axios from 'axios';

export default class extends Phaser.Scene {
  constructor () {
    super({ key: 'SplashScene' })
  }

  preload () {
    //
    // load your assets
    //
    this.load.image('pitch', 'assets/graphics/pitch.png')
    this.load.image('goal-left', 'assets/graphics/goal_posts_left.png')
    this.load.image('goal-right', 'assets/graphics/goal_posts_right.png')
    this.load.image('center-line', 'assets/graphics/center_line.png')
    this.load.spritesheet('ball',
      'assets/graphics/ball_frames.png',
      { frameWidth: 48, frameHeight: 48 }
    )
    this.load.spritesheet(
      'paddle-left',
      'assets/graphics/pud_left.png',
      { frameWidth: 44, frameHeight: 100 }
    )
    this.load.spritesheet(
      'paddle-right',
      'assets/graphics/pud_right.png',
      { frameWidth: 50, frameHeight: 100 }
    )
  }

  create () {
    axios.get('https://se8wr4ve0m.execute-api.eu-west-1.amazonaws.com/development/game/connection')
      .then(response => {
        this.scene.start('GameScene', { mqttUrl: response.data.url })
      })
      .catch(error => {
        console.error(error)
      })
  }

  update () {}
}
