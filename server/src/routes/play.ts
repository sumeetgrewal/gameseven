// /game/play route
import { pushUpdateToPlayers, cleanupGame, resetToLobby } from "../middleware/util";
const router = require('express').Router(); 
let game = require('../models/game.model');
let JWTHandlers = require('../middleware/jwt.authorization');
let gameClients: any[] = [];
let sseId: number = 1;

function rotateHands() {
  // TODO 
}

function generateHands() {
  // TODO
}

function beginGame() {
  if (game.metadata.turn === 7) {
    game.metadata.turn = 1;
    game.metadata.age++;
  } else {
    game.metadata.turn++
  }
  game.hands = {
    's': ["1", "2", "3", "4", "5", "6", "7"]
  }
  pushUpdateToPlayers(JSON.stringify({metadata: game.metadata, hand: game.hands['s']}), 'turnupdate', gameClients)
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
    gameClients.push(newClient);
    
    const numPlayers = Object.keys(game.players).length
    if (gameClients.length === numPlayers) {
      beginGame();
    }

    req.on('close', () => {
      res.end();
      gameClients = gameClients.filter((client: any) => client.id !== username);
      if (gameClients.length === 0) {
        cleanupGame();
      } else {
        delete game.players[username];
        resetToLobby();
        pushUpdateToPlayers( JSON.stringify({metadata: game.metadata, players: game.players}), 'gameupdate', gameClients );
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
    const {card, age, turn} = req.body;
    const ageSelections = game.selections[age];game.players[username].cards
    const numPlayers = Object.keys(game.players).length
    if (!game.players[username].cards) {
      game.players[username].cards = [];
    }
    if (!ageSelections[turn]) {
      ageSelections[turn] = []
    }

    game.players[username].cards.push(card);
    ageSelections[turn].push(card);
    res.status(200).json({message: `${username} selected card ${card} in Age ${age} Turn ${turn}`})
    console.log(ageSelections)
    if (ageSelections[turn].length === numPlayers) {
      console.log("All players have selected cards");
      beginGame();
    }
    
  }
});

module.exports = router;