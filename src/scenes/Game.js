/* globals __DEV__ */
import Phaser from 'phaser'

const defaultBallVelocity = { x: -200, y: 200 }
const getDefaultFontStyles = (size, fill = '#fff') => ({
  font: `${size}px Bangers`,
  fill,
  strokeThickness: 6,
  stroke: '#000'
})
let remoteStatus
export default class extends Phaser.Scene {
  constructor () {
    super({ key: 'GameScene' })
    this.ballVelocity = defaultBallVelocity
    this.playerScores = { player1: 0, player2: 0 }
  }
  init (args) {
    const { mic, publishEvent, client } = args
    this.mic = mic
    this.publishEvent = publishEvent
    client.on('message', (topic, message) => {
      const remoteMsg = JSON.parse(message.toString())
      console.log(remoteMsg)
      remoteStatus = remoteMsg
    })
  }
  preload () {}

  create () {
    this.createBackground('Blow football !')
    const pitchContainer = [
      this.createPitchEdge(88, 50, 620, 20),
      this.createPitchEdge(70, 50, 20, 80),
      this.createPitchEdge(710, 50, 20, 80),
      this.createPitchEdge(88, 420, 620, 20),
      this.createPitchEdge(70, 370, 20, 70),
      this.createPitchEdge(710, 370, 20, 70)
    ]
    this.edge = this.createPitchEdge(88, 50, 620, 20)
    this.paddleLeft = this.createPaddle(150, this.cameras.main.centerY, 'left')
    this.paddleRight = this.createPaddle(660, this.cameras.main.centerY, 'right')
    this.ball = this.createBall(this.cameras.main.centerX, this.cameras.main.centerY)
    this.leftGoal = this.createGoal(45, this.cameras.main.centerY, 'left')
    this.rightGoal = this.createGoal(765, this.cameras.main.centerY + 10, 'right')

    this.playerText = this.addPlayerText('Player 1', 'Player 2')

    this.physics.add.collider(this.ball, this.paddleLeft, this.checkPaddleHit('left'), null, this)
    this.physics.add.collider(this.ball, this.paddleRight, this.checkPaddleHit('right'), null, this)
    this.physics.add.collider(this.ball, this.leftGoal, this.checkGoalHit('left'), null, this)
    this.physics.add.collider(this.ball, this.rightGoal, this.checkGoalHit('right'), null, this)

    pitchContainer.forEach(edge => {
      this.physics.add.collider(this.ball, edge, this.checkEdgeHit, null, this)
    })

    this.ballAnimation = this.ballTravel()
    this.transmit = this.updateRemote()
    this.ballHit = this.createBallHit()

    this.goalText = this.createScoreSplash(this.cameras.main.centerX, this.cameras.main.centerY)
    this.publishEvent({ action: 'gameStart' })
  }

  update () {
    this.lift = (this.mic.getLevel() * 100)
    this.controlPlayer(this.lift, this.paddleLeft)
    if (remoteStatus) {
      if (remoteStatus.lift) {
        this.controlPlayer(remoteStatus.lift, this.paddleRight)
      }
      if (remoteStatus.score) {
        this.playerScores.player2 = remoteStatus.score
      }
    }
    this.transmit(this.lift)
    this.ballAnimation()
  }

  updateRemote () {
    let interval
    return (lift, score) => {
      if (!interval) {
        interval = setInterval(() => {
          this.publishEvent({ lift, score })
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
      if (newX > lastPoint && this.ball.anims._reverse) {
        this.ball.anims.reverse('ball-roll')
      }
      if (newX < lastPoint) {
        this.ball.anims.reverse('ball-roll')
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
    if (paddle.y > 360) {
      paddle.setY(360)
    }
    if (paddle.y < 150) {
      paddle.setY(150)
    }
    paddle.setVelocityY(y)
  }

  checkEdgeHit (ball, edge) {
    this.ballHit.x = ball.x - 5
    this.ballHit.y = ball.y - 5
    this.ballHit.anims.play('ball-hit-ani', true)
    this.ballHit.setVisible(true)
  }

  checkGoalHit (direction) {
    return (ball, goal) => {
      if (direction === 'right') {
        this.playerScores.player1 += 1
        this.playerText.player1.score.setText(`${this.playerScores.player1} `)
        this.transmit(null, this.playerScores.player1)
      }
      if (direction === 'left') {
        this.playerScores.player2 += 1
        this.playerText.player2.score.setText(`${this.playerScores.player2} `)
      }
      this.goalText.setVisible(true)
      this.scene.pause()
      setTimeout(() => {
        this.resetGame()
      }, 3000)
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
      paddle.anims.play(`paddle-${direction}`, true)
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
    this.goalText.setVisible(false)
    this.scene.resume('GameScene')
  }

  createPitchEdge (x, y, width, height) {
    const graphic = this.add.graphics({ x, y })
    this.physics.add.existing(graphic)
    graphic.body.setSize(width, height, true)
    graphic.body.immovable = true
    return graphic
  }

  createScoreSplash (x, y) {
    const goalText = this.add.image(x, y, 'goal-text')
    goalText.setVisible(false)
    return goalText
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
    this.anims.create({
      key: 'ball-roll',
      frames: this.anims.generateFrameNumbers('ball'),
      frameRate: 35,
      repeat: -1
    })
    ball.anims.load('ball-roll')
    ball.setOrigin(0.5, 0.5)
    ball.setSize(30, 30)
    ball.setCollideWorldBounds(true)
    ball.setBounce(1)
    ball.setVelocityY(this.ballVelocity.y)
    ball.setVelocityX(this.ballVelocity.x)
    ball.anims.play('ball-roll', 0)
    return ball
  }

  createBallHit () {
    const ballHit = this.physics.add.sprite(10, 10, 'ball-hit')
    this.anims.create({
      key: 'ball-hit-ani',
      frames: this.anims.generateFrameNumbers('ball-hit'),
      frameRate: 15
    })
    ballHit.on('animationcomplete', (animation, frame) => {
      ballHit.setVisible(false)
    }, this)
    ballHit.anims.load('ball-hit-ani')
    ballHit.setOrigin(0.5, 0.5)
    ballHit.setVisible(false)
    return ballHit
  }

  createGoal (x, y, direction) {
    const goal = this.physics.add.sprite(x, y, `goal-${direction}`)
    goal.setOrigin(0.5, 0.5)
    goal.body.immovable = true
    goal.setSize(50, 400, true)
    if (direction === 'left') {
      goal.setDisplaySize(80, 350)
    } else {
      goal.setDisplaySize(100, 360)
    }
    return goal
  }

  createPaddle (x, y, direction) {
    const paddle = this.physics.add.sprite(x, y, `paddle-${direction}`)
    this.anims.create({
      key: `paddle-${direction}`,
      frames: this.anims.generateFrameNumbers(`paddle-${direction}`),
      frameRate: 40
    })
    paddle.on('animationcomplete', (animation, frame) => {
      if (!paddle.anims._reverse) {
        paddle.anims.playReverse(`paddle-${direction}`)
      }
    }, this)
    paddle.anims.load(`paddle-${direction}`)
    paddle.body.immovable = true
    paddle.setOrigin(0.5, 0.5)
    paddle.setSize(30, 80, true)
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
