/* globals __DEV__ */
import Phaser from 'phaser'
const defaultBallVelocity = { x: Phaser.Math.Between(-100, 100), y: 100 }

export default class extends Phaser.Scene {
  constructor () {
    super({ key: 'GameScene' })
    this.ballVelocity = defaultBallVelocity
    this.playerScores = { player1: 0, player2: 0 }
  }
  init () {}
  preload () {}

  create () {
    this.add.image(400, 250, 'pitch')
    this.addTitle('football game')
    this.paddleLeft = this.createPaddle(150, this.cameras.main.centerY, 'left')
    this.paddleRight = this.createPaddle(650, this.cameras.main.centerY, 'right')
    this.ball = this.createBall(this.cameras.main.centerX, this.cameras.main.centerY)

    this.cursors = this.input.keyboard.createCursorKeys()
    console.log(this.input)

    this.physics.add.collider(this.ball, this.paddleLeft, this.checkPaddleHit, null, this)
    this.physics.add.collider(this.ball, this.paddleRight, this.checkPaddleHit, null, this)
  }

  update () {
    this.controlPlayer1(this.cursors.up)
  }

  controlPlayer1 (upKey) {
    if (upKey.isDown) {
      this.controlPaddle(this.paddleLeft, -150)
    }

    if (!upKey.isDown) {
      this.controlPaddle(this.paddleLeft, 40)
    }
  }

  controlPaddle (paddle, y) {
    paddle.setVelocityY(y)
  }

  checkPaddleHit (ball, paddle) {
    const { x, y } = this.ballVelocity
    this.ballVelocity.x = x + 5
    this.ballVelocity.x = x * -1
    ball.setVelocityX(this.ballVelocity.x)

    if (y < 0) {
      this.ballVelocity.y = y * -1
      ball.setVelocityY(this.ballVelocity.y)
    }
  }

  resetGame () {
    this.ballVelocity = defaultBallVelocity
    this.ball.y = this.cameras.main.centerY
    this.ball.x = this.cameras.main.centerX
    this.paddleLeft.y = this.cameras.main.centerY
    this.paddleRight.y = this.cameras.main.centerY

    this.ball.setVelocityX(this.ballVelocity.x)
    this.ball.setVelocityY(this.ballVelocity.y)
  }

  createBall (x, y) {
    const ball = this.physics.add.sprite(x, y, 'ball')
    ball.setCollideWorldBounds(true)
    ball.setBounce(1)
    ball.setVelocityY(this.ballVelocity.y)
    ball.setVelocityX(this.ballVelocity.x)
    return ball
  }

  createPaddle (x, y, direction) {
    const paddle = this.physics.add.sprite(x, y, `paddle-${direction}`)
    paddle.setOrigin(0.5, 0.5)
    paddle.setCollideWorldBounds(true)
    return paddle
  }

  addTitle (title) {
    this.add.text(250, 0, `${title} `, {
      font: '54px Bangers',
      fill: '#fff',
      strokeThickness: 6,
      stroke: '#000'
    })
  }
}
