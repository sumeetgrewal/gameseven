// /game/play route
import { pushUpdateToPlayers, cleanupGame, resetToLobby } from "../middleware/util";
import { game } from '../models/game.model'
import { Player } from "../models/player.model";
import { sendPlayerData, beginAge, validateSelection, handleCardSelect } from "../middleware/gameplay";
const router = require('express').Router(); 
let JWTHandlers = require('../middleware/jwt.authorization');
export let gameClients: any[] = [];
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
    res.write(`data: ${JSON.stringify({players: game.players})}\n\n`);
    res.flush();
    
    const newClient: any = {
      id: username,
      res
    }
    gameClients.push(newClient);
    sendPlayerData(username, false);

    const numPlayers = Object.keys(game.players).length
    if (gameClients.length === numPlayers) {
      beginAge();
    }

    const keepAliveMS = 45000;
    function keepAlive() {
      res.write(':\n\n');
      setTimeout(keepAlive, keepAliveMS);
    }
    setTimeout(keepAlive, keepAliveMS);

    req.on('close', () => {
      res.end();
      if (gameClients.length === 0) {
        cleanupGame();
      } else {
        delete game.players[username];
        resetToLobby();
        pushUpdateToPlayers( JSON.stringify({metadata: game.metadata, players: game.players}), 'gameUpdate', gameClients );
        gameClients = [];
      }
      console.log(username + ' Connection closed');
    });
  }
});

router.route('/').post((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if (!decodedToken) {
    return res.status(400).json({status: 'Error', message: 'Invalid token'});
  } else if (!(decodedToken.username in game.players)) {
    return res.status(400).json({status: 'Error', message: 'Player not found'});
  } else {
    const username: string = decodedToken.username;
    const {card, action, age, turn, purchase} = req.body;
    const player: Player = game.gameData.playerData[username];
    if (validateSelection(username, card, action)) {
      handleCardSelect(player, username, card, action, age, turn, purchase);
      res.status(200).json({message: `${username} selected card ${card} in Age ${age} Turn ${turn}`})
    } else {
      res.status(400).json({status: 'Error', message: `Invalid Selection: Can't build card # ${card}`})
    }
  }
});

module.exports = router;
