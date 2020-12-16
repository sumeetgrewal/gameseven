import { game, serverData, pushUpdateToPlayers } from '../models/game.model';
import { Player } from "../models/player.model";
import { BuildOptions, PurchaseOptions, ConditionData, StageOptions, } from "../models/playerData.model";
import { handleMilitary } from "./military";
import { calculatePoints } from "./points";
import { sendFeedUpdate } from "./gameFeed";
import { Validator } from"../models/validator.model"
let conditionsToRedeem: {player: Player, condition: ConditionData[]}[] = [];
const validator = new Validator();

// --------------------
// CARD MANAGEMENT
// --------------------

function removeCardFromHand(playerName: string, card: string) {
    const handID = game.players[playerName].handID;
    const newHand: string[] = game.hands[handID];
    newHand.splice(newHand.indexOf(card), 1);
    game.hands[handID] = newHand;
}

function rotateHands(clockwise: boolean = true) {
  const numHands = Object.keys(game.hands).length;
  Object.keys(game.players).forEach((player: string) => {
    const currID = game.players[player].handID;
    (clockwise)
      ? (game.players[player].handID = ((currID + 1) % numHands))
      : (game.players[player].handID = (currID + (numHands - 1)) % numHands);
  });
}

function filterCardsByAge(age: number, numPlayers: number) {
  const selectedCards = [];
  const start: number = (age - 1) * 49 + 1;
  const end: number = Math.min(age * 49, 138);
  if (age === 3) {
    let guilds = shuffle(Array.from(Array(10).keys()));
    guilds.splice(0, numPlayers + 2).forEach((i: number) => selectedCards.push(i + 139));
  }
  for (let i: number = start; i <= end; i++) {
    if (game.cards[i.toString()])
      selectedCards.push(i);
  }
  return selectedCards;
}

export function shuffle(a: number[]) {
  for (let i: number = a.length - 1; i > 0; i--) {
      const j: number = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateHands(numPlayers: number) {
  const cards = filterCardsByAge(game.metadata.age, numPlayers);
  const shuffledArray = shuffle(cards);
  let hands: any = {};
  for (let i = 0; i < numPlayers; i++) {
    hands[i] = shuffledArray.splice(0, 7);
  }
  game.hands = hands;
}

// --------------------
// GAME STATE MANAGEMENT
// --------------------

function updateTurn() {
  if (game.metadata.turn === 6) {
    handleMilitary()
    if (game.metadata.age === 3) {
      return endGame()
    }
    else {
      game.metadata.age++;
      game.metadata.turn = 1;
      return beginAge();
    }
  }
  else {
    game.metadata.turn++;
  }
  rotateHands(!(game.metadata.age === 2));
  sendTurnUpdate();
  sendFeedUpdate();
}

function endGame() {
  const players = Object.entries(game.gameData.playerData);
  players.forEach((player: [string, Player]) => {
    const conditions = player[1].conditionalResources;
    conditions.forEach((condition: ConditionData) => {
      game.gameData.playerData[player[0]].redeemCondition(condition)
    })
    const total = calculatePoints(player[1]);
    console.log(`${player[0]} ${total}`)
    game.gameData.playerData[player[0]].score = total;
  })
  sendFeedUpdate();
  sendPlayerData("", true);
  sendAllPlayerData();
  sendGameResults();
}

function sendTurnUpdate() {
  serverData.clients.forEach((client: any) => {
    const handID = game.players[client.id].handID;
    const hand = game.hands[handID];
    const player = game.gameData.playerData[client.id];
    if (hand) {
      const handInfo: any = {};
      hand.forEach((cardID: any) => {
        const buildOptions: BuildOptions = validator.canBuild(cardID, player);
        handInfo[cardID] = buildOptions;
      });
      let stageInfo: StageOptions;
      if (player.stagesBuilt === 3) {
        stageInfo = {
          stage: -1,
          cost: [],
          value: [],
          options: { costMet: false, coinCost: 0, purchaseOptions: [] },
        };
      }
      else
        stageInfo = {
          stage: player.stagesBuilt + 1,
          cost: player.stageData[player.stagesBuilt + 1].cost,
          value: player.stageData[player.stagesBuilt + 1].value,
          options: validator.canStage(player),
        };
      game.players[client.id].handInfo = handInfo;
      game.players[client.id].stageInfo = stageInfo;
      pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata, hand, handInfo, stageInfo }), 'turnUpdate', [client]);
    }
  });
}

function sendAllPlayerData() {
    pushUpdateToPlayers(JSON.stringify({ playerData: game.gameData.playerData }), 'allPlayerDataUpdate', serverData.clients);
}
  
export function sendPlayerData(username: string, sendToAll: boolean): void {
  serverData.clients.forEach((client: any) => {
    if (sendToAll || client.id === username) {
      pushUpdateToPlayers(JSON.stringify({ myData: game.gameData.playerData[client.id] }), 'playerDataUpdate', [client]);
    }
  });
}

export function sendGameResults(): void {
  pushUpdateToPlayers(JSON.stringify({}), 'gameResults', serverData.clients);
}

export function beginAge(): void {
    const playerIDs = Object.keys(game.players);
    for (let i = 0; i < playerIDs.length; i++) {
      game.players[playerIDs[i]].handID = i;
    }
    sendFeedUpdate();
    generateHands(playerIDs.length);
    sendTurnUpdate();
    sendAllPlayerData();
}

export function cleanupGame() {
  game.metadata = {
    gameStatus: 'lobby',
    playerOrder: [],
    age: 1,
    turn: 1,
  };
  game.setupData = {
    boards: [],
    assignedBoards: [],
    turnToChoose: -1,
  }
  game.players = {},
  game.selections = { 1: {}, 2: {}, 3: {}, },
  game.gameData = { playerData: {}, discardPile: [], }
  game.gameFeed = [];
  if (serverData.gameCountdown) {
    clearTimeout(serverData.gameCountdown);
  }
  console.log("Game Cleanup");
}

export function resetToLobby() {
  for (const username in game.players) {
    game.players[username] = { status: 'pending' };
  }
  game.metadata = {
    gameStatus: 'lobby',
    playerOrder: [],
    age: 1,
    turn: 1,
  };
  game.setupData = {
    boards: [],
    assignedBoards: [],
    turnToChoose: -1,
  }
  game.selections = { 1: {}, 2: {}, 3: {}, }
  game.gameData = { playerData: {}, discardPile: [], }
  game.gameFeed = [];

  if (serverData.gameCountdown) {
    clearTimeout(serverData.gameCountdown);
  }
  console.log("Game Reset to Lobby")
}


// --------------------
// BUILD MANAGEMENT
// --------------------

export function validateSelection(username: string, card: string, action: string): boolean {
  const handInfo = game.players[username].handInfo;
  const isCardInHand: boolean = Object.keys(handInfo).includes(String(card));
  const isCostMet: boolean = handInfo[card].costMet;
  const isStageCostMet: boolean = game.players[username].stageInfo.options.costMet;
  if (action === 'build')
    return (isCardInHand && isCostMet);
  else if (action === 'discard')
    return (isCardInHand);
  else if (action === 'stage')
    return (isStageCostMet);
}

export function handleCardSelect(player: Player, username: string, card: string, action: string, age: number, turn: number, purchase: PurchaseOptions): void {
  const buildOptions: BuildOptions = game.players[username].handInfo[card];
  const stageOptions: StageOptions = game.players[username].stageInfo;
  const { coinCost } = buildOptions;
  const ageSelectedCards = game.selections[age];
  const numPlayers = Object.keys(game.players).length;
  if (!ageSelectedCards[turn]) {
    ageSelectedCards[turn] = [];
  }
  ageSelectedCards[turn].push(card);

  if (action === "discard") {
    player.discard(card);
  }
  else if (action === "build") {
    const condition: ConditionData[] = player.selectCard(card, coinCost, purchase);
    if (condition)
      conditionsToRedeem.push({ player, condition });
  }
  else if (action === "stage") {
    player.buildStage(stageOptions, purchase);
  }
  removeCardFromHand(username, card);

  if (ageSelectedCards[turn].length === numPlayers) {
    console.log("All players have selected cards");
    while (conditionsToRedeem.length > 0) {
      const data = conditionsToRedeem.pop();
      for (let j = 0; j < data.condition.length; j++) {
        data.player.redeemCondition(data.condition[j]);
      }
    }

    updateTurn();
    sendPlayerData(username, true);
    sendAllPlayerData();
  }
}
