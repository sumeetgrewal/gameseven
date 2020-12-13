import { cleanupGame, resetToLobby } from '../middleware/gameplay';
import { game, serverData, pushUpdateToPlayers } from '../models/game.model';

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
      console.log("Closed connection", username);
      res.end();
      removeClient(username);
    })
  }
})

router.route('/').delete((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if (!decodedToken) {
    res.status(400).json({status: 'Error', message: 'Invalid token'});
  } else if (!(decodedToken.username in game.players)) {
    res.status(400).json({status: 'Error', message: 'Player not found'});
  } else {
    const username: string = decodedToken.username;
    serverData.clients = serverData.clients.filter((client: any) => client.id !== username);
    delete game.players[username];
    resetToLobby();
    pushUpdateToPlayers( JSON.stringify({players: game.players}), 'playerupdate', serverData.clients );
    res.json({status: 'success'});
  }
});

function addClient(username: string, res: any) {
  serverData.clients = serverData.clients.filter((client: any) => client.id !== username);
  const newClient: any = {
    id: username,
    res
  }
  serverData.clients.push(newClient);
  const keepAlive = () => {
    pushUpdateToPlayers('keep-alive', 'keepalive', [newClient]);
    setTimeout(keepAlive, keepAliveMS);
  }
  setTimeout(keepAlive, keepAliveMS);
}

function removeClient(username: string) {
  const gameStatus = game.metadata.gameStatus;
  serverData.clients = serverData.clients.filter((client: any) => client.id !== username);
  const clients = serverData.clients;
  if (clients.length === 0) {
    console.log("Clients empty : ", clients);
    cleanupGame();
  } else if (gameStatus === 'game') {
    delete game.players[username];
    resetToLobby();
    pushUpdateToPlayers( JSON.stringify({metadata: game.metadata, players: game.players}), 'gameUpdate', clients);
    pushUpdateToPlayers(JSON.stringify({metadata: game.metadata, setupData: game.setupData}), 'setupUpdate', clients);
  } else if (gameStatus === 'lobby') {
    delete game.players[username];
    pushUpdateToPlayers(JSON.stringify({ players: game.players }), 'playerupdate', clients);
  } else if (gameStatus === 'boardSelection') {
    delete game.players[username];
    resetToLobby();
    pushUpdateToPlayers(JSON.stringify({players: game.players}), 'playerupdate', clients);
    pushUpdateToPlayers(JSON.stringify({metadata: game.metadata, setupData: game.setupData}), 'setupUpdate', clients);
  }
}

module.exports = router;
