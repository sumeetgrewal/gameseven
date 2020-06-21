const router = require('express').Router();
let clients: any[] = [];
let game = require('../models/game.model');
let JWTHandlers = require('../middleware/jwt.authorization');
let sseId: number = 1;

function shuffle(a: number[]) {
  for (let i: number = a.length - 1; i > 0; i--) {
      const j: number = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pushUpdateToPlayers(data: string, event: string = 'message') {
  clients.forEach( (client: any) => {
    client.res.write(`id: ${sseId++}\n`);
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${data}\n\n`);
    client.res.flush();
  });
}

function startGame() {
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

function cleanupGame() {
  game.metadata.gameStatus = "lobby";
  delete game.metadata.playerOrder;
  delete game.metadata.turnToChoose;
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
        // TODO: handle case where player leaves while choosing a board (depends on how we handle it on the frontend)
        // do we want 1 listener for the whole game or 1 for lobby/choosing board and 1 for actual game
        delete game.players[username];
        pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
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
        startGame();
      }
    }

    if (req.body.board) {
      const metadata: any = game.metadata;
      console.log(metadata);
      if (metadata.playerOrder && (metadata.turnToChoose + 1)) {
        if (metadata.playerOrder[metadata.turnToChoose] !== username) {
          return res.status(400).json({status: 'Error', message: 'Not your turn!'});
        } else {
          const board: number = req.body.board - 1;
          game.players[username].board = board;
          game.metadata.turnToChoose++;
          pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
          pushUpdateToPlayers( JSON.stringify({metadata: game.metadata}), 'gameupdate' );
          const allSelected = game.metadata.turnToChoose === clients.length;
          if (allSelected) {
            game.metadata.gameStatus = 'game'
            // TODO: send boards to players
            delete game.metadata.turnToChoose;
            delete game.metadata.playerOrder;
            pushUpdateToPlayers ( JSON.stringify({metadata: metadata}), 'gameupdate' )
          }
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