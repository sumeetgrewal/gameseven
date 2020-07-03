import { pushUpdateToPlayers, cleanupGame, resetToLobby } from "../middleware/util";
const router = require('express').Router();
let game = require('../models/game.model');
let JWTHandlers = require('../middleware/jwt.authorization');
let clients: any[] = [];
let sseId: number = 1;

function beginGame() {
  game.metadata = {
    age: 1,
    turn: 1,
    playerOrder: game.metadata.playerOrder,
  }
  game.hands = {
    's': ["1", "2", "3", "4", "5", "6", "7"]
  }
  pushUpdateToPlayers(JSON.stringify({metadata: game.metadata, hand: game.hands['s']}), 'turnupdate', clients)
}

router.route('/').get((req: any, res: any) => {
  console.log("Game beginning")
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
    res.write(`data: ${JSON.stringify({players: game.players})}\n\n`);
    res.flush();
    
    const newClient: any = {
      id: username,
      res
    }
    clients.push(newClient);

    const numPlayers = Object.keys(game.players).length
    if (clients.length === numPlayers) {
      beginGame();
    }

    req.on('close', () => {
      res.end();
      clients = clients.filter((client: any) => client.id !== username);
      if (clients.length === 0) {
        cleanupGame();
      } else {
        delete game.players[username];
        resetToLobby();
        pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate', clients );
        pushUpdateToPlayers( JSON.stringify({metadata: game.metadata}), 'gameupdate', clients );
      }
      console.log(username + ' Connection closed');
    });
  }
});

module.exports = router;