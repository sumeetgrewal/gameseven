import { gameCountdown } from "../routes/setup";
let game = require('../models/game.model');
let sseId: number = 2;

export function shuffle(a: number[]) {
  for (let i: number = a.length - 1; i > 0; i--) {
      const j: number = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pushUpdateToPlayers(data: string, event: string = 'message', clients: any) {
  clients.forEach((client: any) => {
    client.res.write(`id: ${sseId++}\n`);
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${data}\n\n`);
    client.res.flush();
  });
}

export function cleanupGame() {
  console.log("Cleanup");
  game.metadata = {
      boards: [],
      assignedBoards: [],
      turnToChoose: -1,
      playerOrder: [],
      gameStatus: "lobby",
      age: 1,
      turn: 1,
    };
  game.players = {},
  game.selections = {
    1: {},
    2: {},
    3: {},
  },
  clearTimeout(gameCountdown);
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
    age: 1,
    turn: 1,
  };
  game.selections = {
    1: {},
    2: {},
    3: {},
  }
}
