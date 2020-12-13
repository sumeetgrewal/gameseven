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
    },
    discardPile: [],
  },
  gameFeed: []
}

export let serverData: any = {
  clients: [],
  gameCountdown: undefined,
}

let sseId: number = 2;

export function pushUpdateToPlayers(data: string, event: string = 'message', clients: any) {
  clients.forEach((client: any) => {
    client.res.write(`id: ${sseId++}\n`);
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${data}\n\n`);
    client.res.flush();
  });
}
