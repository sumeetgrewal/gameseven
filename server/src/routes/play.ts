// /game/play route
import { pushUpdateToPlayers, cleanupGame, resetToLobby, shuffle } from "../middleware/util";
import { game } from '../models/game.model'
import { Player } from "../models/player.model";
import { BuildOptions } from "../models/playerData.model";
const router = require('express').Router(); 
let JWTHandlers = require('../middleware/jwt.authorization');
let gameClients: any[] = [];
let sseId: number = 1;

//TODO rotate in opposite direction in age 2
function rotateHands() {
  const numHands = Object.keys(game.hands).length;
    Object.keys(game.players).forEach((player: string) => {
      const currID = game.players[player].handID;
      game.players[player].handID = ((currID % numHands) + 1);
    })
}

function filterCardsByAge(age: number, numPlayers: number) {
  const selectedCards = [];
  const start: number = (age - 1) * 49 + 1
  const end: number = Math.min(age * 49, 138)
  if (age === 3) {
    let guilds = shuffle(Array.from(Array(10).keys()))
    guilds.splice(0, numPlayers + 2).forEach((i: number) => selectedCards.push(i + 139))
  }
  for (let i: number = start; i <= end; i++) {
    if (game.cards[i.toString()]) selectedCards.push(i);
  }
  return selectedCards;
}

function generateHands(numPlayers: number) {
  const cards = filterCardsByAge(game.metadata.age, numPlayers);
  const shuffledArray = shuffle(cards);
  let hands: any = {};
  for (let i = 0 ; i< numPlayers; i++) {
    hands[i + 1] = shuffledArray.splice(0,7);
  }
  game.hands = hands;
}

function updateTurn() {
  if (game.metadata.turn === 6) {
    if (game.metadata.age === 3) {
      // TODO end game
    } else {
      // TODO handle military
      game.metadata.age++;
      game.metadata.turn = 1;
      return beginAge();
    }
  } else {
    game.metadata.turn++
  }
  rotateHands();
  sendTurnUpdate();
}

function sendTurnUpdate() {
  gameClients.forEach((client: any) => {
    const handID = game.players[client.id].handID;
    const hand = game.hands[handID];
    const player = game.gameData.playerData[client.id];
    console.log(client.id, hand);
    if (hand) {
      const handInfo: any= {};
      hand.forEach((cardID: any) => {
        const buildOptions: BuildOptions = player.canBuild(cardID);
        handInfo[cardID] = buildOptions;
      })
      game.players[client.id].handInfo = handInfo;
      console.log(game.players[client.id]);
      pushUpdateToPlayers(JSON.stringify({metadata: game.metadata, hand, handInfo}), 'turnUpdate', [client])
    }
  })
}

function beginAge() {
  const playerIDs = Object.keys(game.players);
  for (let i = 0; i < playerIDs.length; i++ ) {
    game.players[playerIDs[i]].handID = i + 1;
  }
  generateHands(playerIDs.length)
  sendTurnUpdate();
}

function sendPlayerData(username: string) {
  gameClients.forEach((client: any) => {
    if (client.id === username) {
      pushUpdateToPlayers(JSON.stringify({myData: game.gameData.playerData[client.id]}), 'playerDataUpdate', [client])
    }
  })
}

function sendAllPlayerData() {
  pushUpdateToPlayers(JSON.stringify({playerData: game.gameData.playerData}), 'allPlayerDataUpdate', gameClients)
}

function removeCardFromHand(playerName: string, card: string) {
  const handID = game.players[playerName].handID;
  const newHand: string[] = game.hands[handID];
  newHand.splice(newHand.indexOf(card), 1);
  game.hands[handID] = newHand;
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
    sendPlayerData(username);

    const numPlayers = Object.keys(game.players).length
    if (gameClients.length === numPlayers) {
      beginAge();
    }

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
    const {card, action, age, turn} = req.body;
    const player: Player = game.gameData.playerData[username];
    if (validateSelection(username, card, action)) {
      handleCardSelect(player, username, card, action, age, turn);
      res.status(200).json({message: `${username} selected card ${card} in Age ${age} Turn ${turn}`})
    } else {
      res.status(400).json({status: 'Error', message: `Invalid Selection: Can't build card # ${card}`})
    }
  }
});

function validateSelection(username: string, card: string, action: string) {
  const handInfo = game.players[username].handInfo;
  const cards = Object.keys(handInfo);
  const isCardInHand: boolean = cards.includes(String(card));
  const isCostMet: boolean = handInfo[card].costMet;
  if (action==='build') return (isCardInHand && isCostMet);
  else if (action==='discard') return (isCardInHand);
}

function handleCardSelect(player: Player, username: string, card: string, action: string, age: number, turn: number) {
    const options: BuildOptions = game.players[username].handInfo[card];
    const coinCost = options.coinCost;
    const ageSelectedCards = game.selections[age];
    const numPlayers = Object.keys(game.players).length
    if (!ageSelectedCards[turn]) {
      ageSelectedCards[turn] = []
    }
    ageSelectedCards[turn].push(card);

    if (action === "discard") {
      player.discard();
    } else if (action==="build") {
        player.selectCard(card, coinCost);
    }
    removeCardFromHand(username, card)
    sendPlayerData(username);

    if (ageSelectedCards[turn].length === numPlayers) {
      console.log("All players have selected cards");
      updateTurn();
      sendAllPlayerData();
    }
}

module.exports = router;
