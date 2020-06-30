import { pushUpdateToPlayers, cleanupGame, resetToLobby } from "../middleware/util";
const router = require('express').Router();
let game = require('../models/game.model');
let JWTHandlers = require('../middleware/jwt.authorization');
let clients: any[] = [];
let sseId: number = 1;

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
        delete game.players[username];
        resetToLobby();
        pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate' );
        pushUpdateToPlayers( JSON.stringify({metadata: game.metadata}), 'gameupdate' );
      }
      console.log(username + ' Connection closed');
    });
  }
});

module.exports = router;