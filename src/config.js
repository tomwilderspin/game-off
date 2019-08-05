import Phaser from 'phaser'

export default {
  type: Phaser.AUTO,
  parent: 'content',
  width: 800,
  height: 500,
  localStorageName: 'soccergame',
  physics: {
    default: 'arcade',
    arcade: {
      //debug: true
    }
  }
}
