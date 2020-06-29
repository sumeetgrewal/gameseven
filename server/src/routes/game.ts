const router = require('express').Router();
const dbScan = require('../dbScan')
let game = require('../models/game.model');
let JWTHandlers = require('../middleware/jwt.authorization');
let clients: any[] = [];
let sseId: number = 1;
let gameCountdown: any;
let gameAssetsReady: boolean = false;

function shuffle(a: number[]) {
  for (let i: number = a.length - 1; i > 0; i--) {
      const j: number = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  delete game.metadata.playerOrder;
  delete game.metadata.turnToChoose;
  delete game.metadata.boards;
  delete game.metadata.assignedBoards;
  game.metadata.gameStatus = 'game';
  pushUpdateToPlayers( JSON.stringify({metadata: game.metadata}), 'gameupdate' );
}

function assignBoards() {
  let assignedBoards: any[] = [];
  const boardIndices = shuffle(Array.from(Array(7).keys()))
  for (let i = 0; i < 7; i++) {
    let index: string = (boardIndices[i] + 1).toString();
    assignedBoards[i] = game.boards[index].SHORT_NAME;
    const username = game.metadata.boards[i];
    if (game.players[username]) {
      game.players[username].board = assignedBoards[i]
    } else {
      delete game.boards[index];
    };
  }
  return assignedBoards;
}

function pushUpdateToPlayers(data: string, event: string = 'message') {
  clients.forEach( (client: any) => {
    client.res.write(`id: ${sseId++}\n`);
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${data}\n\n`);
    client.res.flush();
  });
}

function resetToLobby() {
  for (const username in game.players) {
    game.players[username] = {status: 'pending'};
  }
  game.metadata = {
    gameStatus: 'lobby',
    boards: [],
    assignedBoards: [],
    playerOrder: [],
    turnToChoose: -1,
  }
}
function startBoardSelection() {
  const numPlayers:  number = clients.length;
  const randomOrder: number[] = shuffle( [...Array(numPlayers).keys()] );
  let index: number = 0;
  game.metadata.playerOrder = new Array<string>(numPlayers);
  for (const username in game.players) {
    game.metadata.playerOrder[randomOrder[index]] = username;
    index++;
  }
  game.metadata.turnToChoose = 0;
  pushUpdateToPlayers( JSON.stringify({metadata: game.metadata}), 'gameupdate' );
}

function prepareGameAssets() {
  let numPlayers: string = clients.length.toString()
  numPlayers = "4"
  loadTable('BOARDS', 'BOARD_ID');
  const cardFilter = {
    FilterExpression: "#np <= :np",
    ExpressionAttributeNames:{
      "#np": "NUM_PLAYERS"
    },
    ExpressionAttributeValues: {
      ":np": {N : numPlayers},
    }
  }
  loadTable('CARDS', 'CARD_ID', cardFilter);
}

function cleanupGame() {
  game.metadata.gameStatus = 'lobby';
  delete game.metadata.playerOrder;
  delete game.metadata.turnToChoose;
  delete game.metadata.boards;
  delete game.metadata.assignedBoards;
  clearTimeout(gameCountdown);
  game.players = {};
  console.log("game reset")
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
    res.write(`id: ${sseId++}\n`);
    res.write(`event: joined\n`);
    res.write(`data: ${JSON.stringify({username, players: game.players, gameStatus: game.metadata.gameStatus})}\n\n`);
    res.flush();
    
    const newClient: any = {
      id: username,
      res
    }
    clients.push(newClient);

    req.on('close', () => {
      res.end();
      clients = clients.filter((client: any) => client.id !== username);
      if (clients.length === 0) {
        cleanupGame();
      } else if (game.metadata.gameStatus === 'lobby') {
        delete game.players[username];
        pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
      } else {
        clearTimeout(gameCountdown);
        delete game.players[username];
        resetToLobby();
        pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
        pushUpdateToPlayers( JSON.stringify({metadata: game.metadata}), 'gameupdate' );
      }
      console.log(username + ' Connection closed');
    });
  }
});

router.route('/setup/').post((req: any, res: any) => {
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
    pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
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
      const status: string = req.body.status;
      game.players[username].status = status;
      pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
      game.metadata.gameStatus = ( Object.values(game.players).every( (player: any) => player.status === 'ready' ) && 'boardSelection' ) || 'lobby';
      if (game.metadata.gameStatus === 'boardSelection') {
        startBoardSelection();
        prepareGameAssets();
      }
    }

    if (req.body.board) {
      const metadata: any = game.metadata;
      if (metadata.playerOrder && (metadata.turnToChoose + 1)) {
        if (metadata.playerOrder[metadata.turnToChoose] !== username) {
          return res.status(400).json({status: 'Error', message: 'Not your turn!'});
        } else {
          const board: number = req.body.board - 1;
          if (!metadata.boards) game.metadata.boards = Array(7);
          game.players[username].board = board;
          game.metadata.boards[board] = username;
          game.metadata.turnToChoose++;
          const allSelected = game.metadata.turnToChoose === clients.length;
          if (allSelected) {
            game.metadata.assignedBoards = assignBoards();
            gameCountdown = setTimeout(() => {
              startGame()
            }, 5000)
          } 
          pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
          pushUpdateToPlayers( JSON.stringify({metadata: metadata}), 'gameupdate' );
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
    clients = clients.filter((client: any) => client.id !== username);
    delete game.players[username];
    pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
    res.json({status: 'success'});
  }
});

module.exports = router;