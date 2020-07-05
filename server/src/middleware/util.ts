import { gameCountdown } from "../routes/setup";
let game = require('../models/game.model');
let sseId: number = 2;

export function pushUpdateToPlayers(data: string, event: string = 'message', clients: any) {
  clients.forEach((client: any) => {
    client.res.write(`id: ${sseId++}\n`);
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${data}\n\n`);
    client.res.flush();
  });
}

export function cleanupGame() {
  game.metadata.gameStatus = 'lobby';
  delete game.metadata.playerOrder;
  delete game.metadata.turnToChoose;
  delete game.metadata.boards;
  delete game.metadata.assignedBoards;
  game.selections = {
    1: {},
    2: {},
    3: {},
  }
  clearTimeout(gameCountdown);
  game.players = {};
  console.log("game reset");
}

export function resetToLobby() {
  for (const username in game.players) {
    game.players[username] = { status: 'pending' };
  }
  game.metadata = {
    gameStatus: 'lobby',
    boards: [],
    assignedBoards: [],
    playerOrder: [],
    turnToChoose: -1,
  };
  game.selections = {
    1: {},
    2: {},
    3: {},
  }
}
