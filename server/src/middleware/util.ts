import { gameCountdown, setupClients } from "../routes/setup";
import { game } from '../models/game.model'
let sseId: number = 2;
const dbScan = require('../dbScan')

export let gameAssetsReady: boolean = false;

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
    gameStatus: 'lobby',
    playerOrder: [],
    age: 1,
    turn: 1,
  };
  game.setupData = {
    boards: [],
    assignedBoards: [],
    turnToChoose: -1,
  }
  game.players = {},
  game.selections = {
    1: {},
    2: {},
    3: {},
  },
  game.gameData = {
    playerData: {},
    discardPile: []
  }
  clearTimeout(gameCountdown);
  console.log("game reset");
}

export function resetToLobby() {
  for (const username in game.players) {
    game.players[username] = { status: 'pending' };
  }
  game.metadata = {
    gameStatus: 'lobby',
    playerOrder: [],
    age: 1,
    turn: 1,
  };
  game.setupData = {
    boards: [],
    assignedBoards: [],
    turnToChoose: -1,
  }
  game.selections = {
    1: {},
    2: {},
    3: {},
  }
  game.gameData = {
    playerData: {},
    discardPile: []
  }
}



function loadTable(tableName: string, id: string, params: {} = {}): Promise<void> {
  return new Promise((resolve) => {
    dbScan.tableScan(tableName, id, params)
    .then((response: any) => {
      game[tableName.toLowerCase()] = response;
      resolve()
    })
  })
}

export function prepareGameAssets(playerCount: number): Promise<void> {
  return new Promise((resolve) => {
    let numPlayers: string = (playerCount <= 3) ? '3' : playerCount.toString()
    const cardFilter = {
      FilterExpression: "#np <= :np",
      ExpressionAttributeNames: {
        "#np": "NUM_PLAYERS"
      },
      ExpressionAttributeValues: {
        ":np": { N: numPlayers },
      }
    };
    loadTable('BOARDS', 'BOARD_ID')
      .then(() => {
        loadTable('CARDS', 'CARD_ID', cardFilter)
          .then(() => {
            gameAssetsReady = true;
            resolve();
          });
      });
  })
}
