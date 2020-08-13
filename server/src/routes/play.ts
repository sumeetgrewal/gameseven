// /game/play route
import { pushUpdateToPlayers, cleanupGame, resetToLobby, shuffle } from "../middleware/util";
import { game } from '../models/game.model'
import { Player } from "../models/player.model";
import { BuildOptions, PurchaseOptions, ConditionData, StageOptions } from "../models/playerData.model";
const router = require('express').Router(); 
let JWTHandlers = require('../middleware/jwt.authorization');
let gameClients: any[] = [];
let sseId: number = 1;
let conditionsToRedeem: {player: Player, condition: ConditionData[]}[] = [];

function rotateHands(clockwise: boolean = true) {
  const numHands = Object.keys(game.hands).length;
    Object.keys(game.players).forEach((player: string) => {
      const currID = game.players[player].handID;
      (clockwise) 
      ? (game.players[player].handID = ((currID  + 1) % numHands))
      : (game.players[player].handID = (currID  + (numHands - 1)) % numHands)
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
    hands[i] = shuffledArray.splice(0,7);
  }
  game.hands = hands;
}

function updateTurn() {
  if (game.metadata.turn === 6) {
    if (game.metadata.age === 3) {
      // TODO end game
    } else {
      handleMilitary()
      game.metadata.age++;
      game.metadata.turn = 1;
      console.log(game.gameData.playerData)
      return beginAge();
    }
  } else {
    game.metadata.turn++
  }
  rotateHands(!(game.metadata.age===2));
  sendTurnUpdate();
}

function handleMilitary() {
  const allPlayerData = game.gameData.playerData;
  const players = Object.entries(allPlayerData);
  // Remove check for num players once minplayers constraint is enforced
  if (players.length >= 3) {
      players.forEach((player: [string, Player]) => {
      const leftBattle = militaryConflict(player[1], allPlayerData[player[1].playerLeft]);
      game.gameData.playerData[player[1].playerLeft] = leftBattle[0];
      game.gameData.playerData[player[0]] = leftBattle[1];
    })
  }

  function militaryConflict(self: Player, opponent: Player) : [Player, Player] {
    if (opponent.shields > self.shields) {
      self.military.loss += 1;
      switch (game.metadata.age) {
        case 1:
          opponent.military.one += 1;
          break;
        case 2:
          opponent.military.three += 1;
          break;
        case 3:
          opponent.military.five += 1;
          break;
        default:
          break;
      }
    }
    else if (opponent.shields < self.shields) {
      opponent.military.loss += 1;
      switch (game.metadata.age) {
        case 1:
          self.military.one += 1;
          break;
        case 2:
          self.military.three += 1;
          break;
        case 3:
          self.military.five += 1;
          break;
        default:
          break;
      }
    }
    return [opponent, self]
  }
}


function sendTurnUpdate() {
  gameClients.forEach((client: any) => {
    const handID = game.players[client.id].handID;
    const hand = game.hands[handID];
    const player = game.gameData.playerData[client.id];
    if (hand) {
      const handInfo: any= {};
      hand.forEach((cardID: any) => {
        const buildOptions: BuildOptions = player.canBuild(cardID);
        handInfo[cardID] = buildOptions;
      })
      let stageInfo: StageOptions;
      if (player.stagesBuilt === 3) {
        stageInfo = {
          stage: -1,
          cost: [],
          value: [],
          options: {costMet: false, coinCost: 0, purchaseOptions: []},
        }
       } else stageInfo = {
        stage: player.stagesBuilt + 1,
        cost: player.stageData[player.stagesBuilt + 1].cost,
        value: player.stageData[player.stagesBuilt + 1].value,
        options: player.canStage(),
      } 
      game.players[client.id].handInfo = handInfo;
      game.players[client.id].stageInfo = stageInfo;
      pushUpdateToPlayers(JSON.stringify({metadata: game.metadata, hand, handInfo, stageInfo}), 'turnUpdate', [client])
    }
  })
}

function beginAge() {
  const playerIDs = Object.keys(game.players);
  for (let i = 0; i < playerIDs.length; i++ ) {
    game.players[playerIDs[i]].handID = i;
  }
  generateHands(playerIDs.length)
  sendTurnUpdate();
  sendAllPlayerData();
}

function sendPlayerData(username: string, sendToAll: boolean) {
  gameClients.forEach((client: any) => {
    if (sendToAll || client.id === username) {
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
    sendPlayerData(username, false);

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

function validateSelection(username: string, card: string, action: string) {
  const handInfo = game.players[username].handInfo;
  const isCardInHand: boolean = Object.keys(handInfo).includes(String(card));
  const isCostMet: boolean = handInfo[card].costMet;
  const isStageCostMet: boolean = game.players[username].stageInfo.options.costMet;
  if (action==='build') return (isCardInHand && isCostMet);
  else if (action==='discard') return (isCardInHand);
  else if (action==='stage') return (isStageCostMet);
}

function handleCardSelect(player: Player, username: string, card: string, action: string, age: number, turn: number, purchase: PurchaseOptions) {
    const buildOptions: BuildOptions = game.players[username].handInfo[card];
    const stageOptions: StageOptions = game.players[username].stageInfo;
    const {coinCost} = buildOptions;
    const ageSelectedCards = game.selections[age];
    const numPlayers = Object.keys(game.players).length
    if (!ageSelectedCards[turn]) {
      ageSelectedCards[turn] = []
    }
    ageSelectedCards[turn].push(card);

    if (action === "discard") {
      player.discard(card);
    } else if (action==="build") {
      const condition: ConditionData[] = player.selectCard(card, coinCost, purchase);
      if (condition) conditionsToRedeem.push({player, condition});
    } else if (action==="stage") { 
      player.buildStage(stageOptions, purchase)
    }
    removeCardFromHand(username, card)
    
    if (ageSelectedCards[turn].length === numPlayers) {
      console.log("All players have selected cards");
      while (conditionsToRedeem.length > 0) {
        const data = conditionsToRedeem.pop();
        for (let j = 0; j < data.condition.length; j++) {
          data.player.redeemCondition(data.condition[j])
        }
      }

      sendPlayerData(username, true);
      updateTurn();
      sendAllPlayerData();
    }
}

module.exports = router;
