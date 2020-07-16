import { pushUpdateToPlayers, cleanupGame, resetToLobby, shuffle } from "../middleware/util";

import { game } from '../models/game.model'
import { Player } from '../models/player.model'
const router = require('express').Router();
const dbScan = require('../dbScan')
let JWTHandlers = require('../middleware/jwt.authorization');
let setupClients: any[] = [];
export let gameCountdown: any;
let gameAssetsReady: boolean = false;

function startBoardSelection() {
  const numPlayers: number = setupClients.length;
  const randomOrder: number[] = shuffle([...Array(numPlayers).keys()]);
  let index: number = 0;
  game.metadata.playerOrder = new Array<string>(numPlayers);
  for (const username in game.players) {
    game.metadata.playerOrder[randomOrder[index]] = username;
    index++;
  }
  game.setupData.turnToChoose = 0;
  pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata, setupData: game.setupData }), 'gameupdate', setupClients);
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

function startGame(){
  delete game.setupData
  for (const username in game.players) {
    const board = game.boards[game.players[username].boardID];
    const player = new Player(board);
    const {playerOrder} = game.metadata;
    const playerIndex = playerOrder.indexOf(username);
    if (playerIndex >= 0) {
      const left = playerOrder[playerIndex - 1];
      const right = playerOrder[(playerIndex % (playerOrder.length)) + 1];
      if (left) player.playerLeft = left;
      if (right) player.playerRight = right;
    }
    game.gameData.playerData[username] = player;
  }
  console.log(game.gameData);
  game.metadata.gameStatus = 'game';
  pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata }), 'gameupdate', setupClients);
}

function assignBoards(): string[] {
  let assignedBoards: string[] = [];
  while (!gameAssetsReady) {
  }
  const boardIndices = shuffle(Array.from(Array(7).keys()))
  for (let i = 0; i < 7; i++) {
    let index: string = (boardIndices[i] + 1).toString();
    assignedBoards[i] = game.boards[index].SHORT_NAME;
    const username = game.setupData.boards[i];
    
    if (game.players[username]) {
      game.players[username].board = assignedBoards[i];
      game.players[username].boardID = index;
      game.boards[index].PLAYER = username;
    } else {
      delete game.boards[index];
    };
  }
  return assignedBoards;
}

function prepareGameAssets() {
  let numPlayers: string = setupClients.length.toString()
  numPlayers = '3';
  const cardFilter = {
    FilterExpression: "#np <= :np",
    ExpressionAttributeNames:{
      "#np": "NUM_PLAYERS"
    },
    ExpressionAttributeValues: {
      ":np": {N : numPlayers},
    }
  }
  loadTable('BOARDS', 'BOARD_ID')
  .then(() => {
    loadTable('CARDS', 'CARD_ID', cardFilter)
    .then(() => gameAssetsReady = true)
  })
}

function updateBoard(req: any, username: string) {
  const setupData: any = game.setupData
  const board: number = req.body.board - 1;
  if (!setupData.boards)
    game.setupData.boards = Array(7);
  game.players[username].board = board;
  game.setupData.boards[board] = username;
  game.setupData.turnToChoose++;
  const allSelected = game.setupData.turnToChoose === setupClients.length;
  if (allSelected) {
    game.setupData.assignedBoards = assignBoards();
    gameCountdown = setTimeout(() => {
      startGame();
    }, 2000);
  }
  console.log("Selected a board, sending data", setupData)
  pushUpdateToPlayers(JSON.stringify({ players: game.players }), 'playerupdate', setupClients);
  pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata , setupData }), 'gameupdate', setupClients);
}

function updateStatus(req: any, username: string) {
  const status: string = req.body.status;
  game.players[username].status = status;
  pushUpdateToPlayers(JSON.stringify({ players: game.players }), 'playerupdate', setupClients);
  game.metadata.gameStatus = (Object.values(game.players).every((player: any) => player.status === 'ready') && 'boardSelection') || 'lobby';
  if (game.metadata.gameStatus === 'boardSelection') {
    startBoardSelection();
    prepareGameAssets();
  }
}

router.route('/setup').get((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if (!decodedToken) {
    res.status(400).json({status: 'Error', message: 'Invalid token'});
  } else {
    const username: string = decodedToken.username;
    const headers: any = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
    res.write(`id: ${1}\n`);
    res.write(`event: joined\n`);
    res.write(`data: ${JSON.stringify({username, players: game.players, gameStatus: game.metadata.gameStatus})}\n\n`);
    res.flush();
    
    const newClient: any = {
      id: username,
      res
    }
    setupClients.push(newClient);

    req.on('close', () => {
      res.end();
      const gameStatus = game.metadata.gameStatus;
      setupClients = setupClients.filter((client: any) => client.id !== username);
      if (setupClients.length === 0 && gameStatus !== 'game') {
        cleanupGame();
      } else if (gameStatus === 'lobby') {
        delete game.players[username];
        pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate', setupClients );
      } else if (gameStatus === 'boardSelection') {
        clearTimeout(gameCountdown);
        delete game.players[username];
        resetToLobby();
        pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate', setupClients );
        pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata, setupData: game.setupData }), 'gameupdate', setupClients);
      }
      console.log(username + ' Connection closed');
    });
  }
});

router.route('/setup').post((req: any, res: any) => {
  if (game.players.length === 7){
    res.status(400).json({status: 'Error', message: 'Game full'});
  } else if (game.metadata.gameStatus !== 'lobby') {
    res.status(400).json({status: 'Error', message: 'Game unavailable'});
  } else if (req.body.username in game.players) {
    res.status(400).json({status: 'Error', message: 'Username taken'});
  } else if (req.body.password !== 'p') {
    res.status(401).json({status: 'Error', message: 'Invalid password'});
  } else {
    const username: string = req.body.username    
    game.players[username] = {status: 'pending'};
    pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate', setupClients );
    const token: string = JWTHandlers.createToken(username);
    res.json({status: 'success', token});
  }
});

router.route('/setup').put((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if (!decodedToken) {
    return res.status(400).json({status: 'Error', message: 'Invalid token'});
  } else if (!(decodedToken.username in game.players)) {
    return res.status(400).json({status: 'Error', message: 'Player not found'});
  } else {
    const username: string = decodedToken.username;
    
    if (req.body.status) {
      updateStatus(req, username);
    }

    if (req.body.board) {
      const {turnToChoose} = game.setupData;
      const {playerOrder} = game.metadata;
      if (playerOrder && (turnToChoose + 1)) {
        if (playerOrder[turnToChoose] !== username) {
          return res.status(400).json({status: 'Error', message: 'Not your turn!'});
        } else {
          updateBoard(req, username);
        }
      } else {
        return res.status(400).json({status: 'Error', message: 'Cannot choose board'});
      }
    }
    res.json({status: 'success'});
  }
});

router.route('/setup').delete((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if (!decodedToken) {
    res.status(400).json({status: 'Error', message: 'Invalid token'});
  } else if (!(decodedToken.username in game.players)) {
    res.status(400).json({status: 'Error', message: 'Player not found'});
  } else {
    const username: string = decodedToken.username;
    setupClients = setupClients.filter((client: any) => client.id !== username);
    delete game.players[username];
    resetToLobby();
    pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate', setupClients );
    res.json({status: 'success'});
  }
});

router.route('/assets').get((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if(!decodedToken) {
    res.status(400).json({status: 'Error', message: 'Invalid token'});
  } else if (!(decodedToken.username in game.players)) {
    res.status(400).json({status:'Error', message: 'Player not found'});
  } else {
    res.status(200).json({boards: game.boards, cards: game.cards})
  }
});

module.exports = router;