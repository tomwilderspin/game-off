/* globals __DEV__ */
import Phaser from 'phaser'
import p5 from 'p5'
import 'p5/lib/addons/p5.sound'
import mqttClient from 'mqtt'
const defaultBallVelocity = { x: -345, y: 350 }
const getDefaultFontStyles = (size, fill = '#fff') => ({
  font: `${size}px Bangers`,
  fill,
  strokeThickness: 6,
  stroke: '#000'
})
let remoteStatus;
export default class extends Phaser.Scene {
  constructor () {
    super({ key: 'GameScene' })
    this.ballVelocity = defaultBallVelocity
    this.playerScores = { player1: 0, player2: 0 }
  }
  init (args) {
    const { mqttUrl } = args
    const client = mqttClient.connect(mqttUrl)
    client.on('connect', function () {
      client.subscribe('tomw/game-off', function (err) {
        if (err) {
          console.error(err)
        }
      })
    })
    this.publishEvent = event => {
      client.publish('tomw/game-off', JSON.stringify(event))
    }
    client.on('message', function (topic, message) {
      remoteStatus = JSON.parse(message.toString())
    })
  }
  preload () {}

  create () {
    this.createBackground('football game')
    this.paddleLeft = this.createPaddle(150, this.cameras.main.centerY, 'left')
    this.paddleRight = this.createPaddle(660, this.cameras.main.centerY, 'right')
    this.ball = this.createBall(this.cameras.main.centerX, this.cameras.main.centerY)
    this.leftGoal = this.createGoal(45, this.cameras.main.centerY, 'left')
    this.rightGoal = this.createGoal(765, this.cameras.main.centerY + 10, 'right')

    this.playerText = this.addPlayerText('Player 1', 'Player 2')
    this.mic = new p5.AudioIn()
    this.mic.start()

    this.physics.add.collider(this.ball, this.paddleLeft, this.checkPaddleHit('left'), null, this)
    this.physics.add.collider(this.ball, this.paddleRight, this.checkPaddleHit('right'), null, this)
    this.physics.add.collider(this.ball, this.leftGoal, this.checkGoalHit('left'), null, this)
    this.physics.add.collider(this.ball, this.rightGoal, this.checkGoalHit('right'), null, this)

    this.createAnimations()
    this.ballAnimation = this.ballTravel()
    this.ball.anims.play('ball-roll', true)
    this.transmit = this.updateRemote()
  }

  update () {
    this.lift = (this.mic.getLevel() * 100)
    this.controlPlayer(this.lift, this.paddleLeft)
    if (remoteStatus) {
      this.controlPlayer(remoteStatus.lift, this.paddleRight)
    }
    this.transmit(this.lift)
    this.ballAnimation()
  }

  updateRemote () {
    let interval
    return lift => {
      if (!interval) {
        interval = setInterval(() => {
          this.publishEvent({ lift, score: this.playerScores.player1 })
          clearInterval(interval)
          interval = null
        }, 100)
      }
    }
  }

  ballTravel () {
    let lastPoint = null
    return () => {
      const newX = this.ball.x
      if (lastPoint == null) {
        lastPoint = newX
        return
      }
      if (newX > lastPoint) {
        this.ball.scaleX = 1
      }
      if (newX < lastPoint) {
        this.ball.scaleX = -1
      }
      lastPoint = newX
    }
  }

  controlPlayer (lift, paddle) {
    const max = 200
    this.controlPaddle(paddle, -Math.abs((max / 100) * (lift * 2)))
    if (lift < 5) {
      this.controlPaddle(paddle, 100)
    }
  }

  controlPaddle (paddle, y) {
    paddle.setVelocityY(y)
  }

  checkGoalHit (direction) {
    return (ball, goal) => {
      if (direction === 'right') {
        this.playerScores.player1 += 1
        this.playerText.player1.score.setText(`${this.playerScores.player1} `)
      }
      if (direction === 'left') {
        this.playerScores.player2 += 1
        this.playerText.player2.score.setText(`${this.playerScores.player2} `)
      }
      this.resetGame()
    }
  }

  checkPaddleHit (direction) {
    return (ball, paddle) => {
      const { x, y } = this.ballVelocity
      this.ballVelocity.x = x + Phaser.Math.Between(1, 6)
      this.ballVelocity.x = x * -1
      ball.setVelocityX(this.ballVelocity.x)
      if (y < 0) {
        this.ballVelocity.y = y * -1
        ball.setVelocityY(this.ballVelocity.y)
      }
    }
  }

  resetGame () {
    this.ballVelocity = defaultBallVelocity
    this.ball.y = (this.cameras.main.centerY + Phaser.Math.Between(10, 100))
    this.ball.x = this.cameras.main.centerX
    this.paddleLeft.y = this.cameras.main.centerY
    this.paddleRight.y = this.cameras.main.centerY

    this.ball.setVelocityX(this.ballVelocity.x)
    this.ball.setVelocityY(this.ballVelocity.y)
  }

  createAnimations () {
    this.anims.create({
      key: 'ball-roll',
      frames: this.anims.generateFrameNumbers('ball', { start: 0, end: 5 }),
      frameRate: 20,
      repeat: -1
    })
  }

  createBackground (titleText) {
    this.add.image(400, 250, 'pitch')
    const centerLine = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'center-line')
    centerLine.setOrigin(0.5, 0.5)
    centerLine.setDisplaySize(185, 320)
    this.addTitle(titleText)
  }

  createBall (x, y) {
    const ball = this.physics.add.sprite(x, y, 'ball')
    ball.setCollideWorldBounds(true)
    ball.setBounce(1)
    ball.setVelocityY(this.ballVelocity.y)
    ball.setVelocityX(this.ballVelocity.x)
    return ball
  }

  createGoal (x, y, direction) {
    const goal = this.physics.add.sprite(x, y, `goal-${direction}`)
    goal.setOrigin(0.5, 0.5)
    goal.body.immovable = true
    if (direction === 'left') {
      goal.setDisplaySize(80, 350)
    } else {
      goal.setDisplaySize(100, 360)
    }
    return goal
  }

  createPaddle (x, y, direction) {
    const paddle = this.physics.add.sprite(x, y, `paddle-${direction}`)
    paddle.body.immovable = true
    paddle.setOrigin(0.5, 0.5)
    paddle.setCollideWorldBounds(true)
    return paddle
  }

  addPlayerText (player1Name, player2Name) {
    return {
      player1: {
        name: this.add.text(55, 16, `${player1Name} `, getDefaultFontStyles(26)),
        score: this.add.text(20, this.cameras.main.centerY - 20, `${this.playerScores.player1} `, getDefaultFontStyles(26))
      },
      player2: {
        name: this.add.text(700, 16, `${player2Name} `, getDefaultFontStyles(26)),
        score: this.add.text(750, this.cameras.main.centerY - 20, `${this.playerScores.player2} `, getDefaultFontStyles(26))
      }
    }
  }

  addTitle (title) {
    this.add.text(250, 0, `${title} `, getDefaultFontStyles(54))
  }
}
