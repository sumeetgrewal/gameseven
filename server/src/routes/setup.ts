import { beginAge, sendPlayerData, shuffle } from "../middleware/gameplay";
import { prepareGameAssets } from "../middleware/data";
import { game, serverData, pushUpdateToPlayers } from '../models/game.model'
import { Player } from '../models/player.model'


const router = require('express').Router();
let JWTHandlers = require('../middleware/jwt.authorization');

function startBoardSelection(numPlayers: number) {
  const randomOrder: number[] = shuffle([...Array(numPlayers).keys()]);
  let index: number = 0;
  game.metadata.playerOrder = new Array<string>(numPlayers);
  for (const username in game.players) {
    game.metadata.playerOrder[randomOrder[index]] = username;
    index++;
  }
  game.setupData.turnToChoose = 0;
  pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata, setupData: game.setupData }), 'setupUpdate', serverData.clients);
}

function startGame(){
  if (game.metadata.gameStatus === 'boardSelection') {
    delete game.setupData
    for (const username in game.players) {
      const board = game.boards[game.players[username].boardID];
      const player = new Player(username, board);
      const {playerOrder} = game.metadata;
      const playerIndex = playerOrder.indexOf(username);
      if (playerIndex >= 0) {
        const numPlayers: number = playerOrder.length;
        const left = playerOrder[(playerIndex + (numPlayers - 1)) % numPlayers];
        const right = playerOrder[(playerIndex + 1) % numPlayers];
        if (left && (left !== username)) player.playerLeft = left;
        if (right && (right !== username) && (right !== left)) player.playerRight = right;
      }
      game.gameData.playerData[username] = player;
    }
    console.log(game.gameData);
    game.metadata.gameStatus = 'game';
    pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata }), 'setupUpdate',serverData.clients);
    sendPlayerData("", true)
    beginAge();
  }
}

function assignBoards(): string[] {
  let assignedBoards: string[] = [];
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

function updateBoard(req: any, username: string) {
  const setupData: any = game.setupData
  const board: number = req.body.board - 1;
  if (!setupData.boards)
    game.setupData.boards = Array(7);
  game.players[username].board = board;
  game.setupData.boards[board] = username;
  game.setupData.turnToChoose++;
  const allSelected = game.setupData.turnToChoose ===serverData.clients.length;
  if (allSelected) {
    game.setupData.assignedBoards = assignBoards();
    serverData.gameCountdown = setTimeout(() => {
      startGame();
    }, 4000);
  }
  console.log("Selected a board, sending data", setupData)
  pushUpdateToPlayers(JSON.stringify({ players: game.players }), 'playerupdate',serverData.clients);
  pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata , setupData }), 'setupUpdate',serverData.clients);
}

function updateStatus(req: any, username: string) {
  const status: string = req.body.status;
  game.players[username].status = status;
  pushUpdateToPlayers(JSON.stringify({ players: game.players }), 'playerupdate', serverData.clients);
  game.metadata.gameStatus = (Object.values(game.players).every((player: any) => player.status === 'ready') && 'boardSelection') || 'lobby';
  if (game.metadata.gameStatus === 'boardSelection') {
    let numPlayers: number = Object.keys(game.players).length;
    prepareGameAssets(numPlayers)
      .then(() => startBoardSelection(numPlayers));
  }
}

router.route('/').post((req: any, res: any) => {
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
    pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate',serverData.clients );
    const token: string = JWTHandlers.createToken(username);
    res.json({status: 'success', token});
  }
});

router.route('/').put((req: any, res: any) => {
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

module.exports = router;
