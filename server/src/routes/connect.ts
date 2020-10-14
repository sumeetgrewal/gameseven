import { cleanupGame, pushUpdateToPlayers, resetToLobby } from '../middleware/util';
import { game } from '../models/game.model';

export let clients: any[] = [];
let JWTHandlers = require('../middleware/jwt.authorization');
const router = require('express').Router(); 
const keepAliveMS = 50000;

router.route('/').get((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if (!decodedToken) { 
    res.status(400).json({ status: 'Error', message: 'Invalid token'});
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
    res.write(`data: ${JSON.stringify({ username, players: game.players, gameStatus: game.metadata.gameStatus})}\n\n`);
    res.flush();

    addClient(username, res);

    req.on('close', () => {
      res.end();
      removeClient(username);
    })
  }
})

function addClient(username: string, res: any) {
  const newClient: any = {
    id: username,
    res
  }
  clients.push(newClient);
  const keepAlive = () => {
    pushUpdateToPlayers('keep-alive', 'keepalive', [newClient]);
    setTimeout(keepAlive, keepAliveMS);
  }
  setTimeout(keepAlive, keepAliveMS);
}

function removeClient(username: string) {
  const gameStatus = game.metadata.gameStatus;
  clients = clients.filter((client: any) => client.id !== username);
  if (clients.length === 0) {
    cleanupGame();
  } else if (gameStatus === 'game') {
    delete game.players[username];
    resetToLobby();
    pushUpdateToPlayers( JSON.stringify({metadata: game.metadata, players: game.players}), 'gameUpdate', clients);
  } else if (gameStatus === 'lobby') {
    delete game.players[username];
    pushUpdateToPlayers(JSON.stringify({ players: game.players }), 'playerupdate', clients);
  } else if (gameStatus === 'boardSelection') {
    delete game.players[username];
    resetToLobby();
    pushUpdateToPlayers(JSON.stringify({players: game.players}), 'playerupdate', clients);
    pushUpdateToPlayers(JSON.stringify({metadata: game.metadata, setupData: game.setupData}), 'gameupdate', clients);
  }
}

module.exports = router;
