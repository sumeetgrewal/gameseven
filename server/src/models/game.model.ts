import { gameModel } from "./playerData.model"

export let game: gameModel = {
  metadata: {
    gameStatus: "lobby",
    playerOrder: [],
    age: 1,
    turn: 1,
  },
  players: {},
  cards: {},
  boards: {},
  setupData: {
    boards: [],
    assignedBoards: [],
    turnToChoose: -1, 
  },
  selections: {
    1: {},
    2: {},
    3: {},
  },
  gameData: {
    playerData: {
      // username : Player
    }
  }
}