import Phaser from 'phaser'
import axios from 'axios'
import mqttClient from 'mqtt'

const getDefaultFontStyles = (size, fill = '#fff') => ({
  font: `${size}px Bangers`,
  fill,
  strokeThickness: 6,
  stroke: '#000'
})

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
    this.load.image('goal-text', 'assets/graphics/text_goal.png')
    this.load.image('title-board', 'assets/graphics/board.png')
    this.load.spritesheet(
      'ball-hit',
      'assets/graphics/ball_hit.png',
      { frameWidth: 80, frameHeight: 64 }
    )
    this.load.spritesheet('ball',
      'assets/graphics/ball_frames.png',
      { frameWidth: 48, frameHeight: 48 }
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
    this.load.spritesheet(
      'start-btn',
      'assets/graphics/btn_round_ok.png',
      { frameWidth: 174, frameHeight: 174 }
    )
  }

  create () {
    this.createBackground('BLOW FOOTBALL')
    const playBtn1 = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'start-btn')
    //const playBtn2 = this.add.image(this.cameras.main.centerX + 100, this.cameras.main.centerY, 'start-btn')
    playBtn1.setDisplaySize(100, 100)
    playBtn1.setInteractive()
    //playBtn2.setDisplaySize(100, 100)
    //playBtn2.setInteractive()
    playBtn1.on('pointerup', () => {
      this.startGame(1)
    })
    /*playBtn2.on('pointerup', () => {
      this.startGame(2)
    })*/
  }

  startGame (player) {
    const p5 = require('p5')
    require('p5/lib/addons/p5.sound')
    const mic = new p5.AudioIn()
    //const listenPlayer = player === 1 ? 'player2' : 'player1'
    //const publishPlayer = player === 1 ? 'player1' : 'player2'
    mic.start()
    return axios.get('https://se8wr4ve0m.execute-api.eu-west-1.amazonaws.com/development/game/connection')
      .then(response => {
        const client = mqttClient.connect(response.data.url)
        client.on('connect', () => {
          client.subscribe(`tomw/game-off`, error => {
            if (error) {
              return console.error('unable to subscribe ', error)
            }
            const publishEvent = event => {
              client.publish(`tomw/game-off`, JSON.stringify(event))
            }
            this.scene.start('GameScene', { client, mic, publishEvent })
          })
        })
      })
      .catch(error => {
        console.error(error)
      })
  }

  createBackground (titleText) {
    this.add.image(400, 250, 'pitch')
    const centerLine = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'center-line')
    const titleBoard = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'title-board')
    titleBoard.setDisplaySize(400, 300)
    centerLine.setOrigin(0.5, 0.5)
    centerLine.setDisplaySize(185, 320)
    this.addTitle(titleText)
  }

  addTitle (title) {
    this.add.text(250, 0, `${title} `, getDefaultFontStyles(54))
    this.add.text(340, 150, 'Click to play ', getDefaultFontStyles(26))
  }

  update () {
  }
}
