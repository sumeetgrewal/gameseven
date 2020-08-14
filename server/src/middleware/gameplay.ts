import { pushUpdateToPlayers, shuffle } from "./util";
import { game } from '../models/game.model';
import { Player } from "../models/player.model";
import { BuildOptions, PurchaseOptions, ConditionData, StageOptions, ResourceList, MilitaryStats } from "../models/playerData.model";
import { gameClients } from "../routes/play";
let conditionsToRedeem: {player: Player, condition: ConditionData[]}[] = [];
const fs = require('fs');

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
// MILITARY 
// --------------------

function handleMilitary() {
  const allPlayerData = game.gameData.playerData;
  const players = Object.entries(allPlayerData);
  // Remove check for num players once minplayers constraint is enforced
  if (players.length >= 3) {
    players.forEach((player: [string, Player]) => {
      const leftBattle = militaryConflict(player[1], allPlayerData[player[1].playerLeft]);
      game.gameData.playerData[player[1].playerLeft] = leftBattle[0];
      game.gameData.playerData[player[0]] = leftBattle[1];
    });
  }

  function militaryConflict(self: Player, opponent: Player): [Player, Player] {
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
    return [opponent, self];
  }
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
        console.log(game.gameData.playerData);
        return beginAge();
      }
    }
    else {
      game.metadata.turn++;
    }
    rotateHands(!(game.metadata.age === 2));
    sendTurnUpdate();
}

function endGame() {
  const players = Object.entries(game.gameData.playerData);
  players.forEach((player: [string, Player]) => {
    const conditions = player[1].conditionalResources;
    conditions.forEach((condition: ConditionData) => {
      game.gameData.playerData[player[0]].redeemCondition(condition)
    })
    const total = calculatePoints(player[1]);
  })
}

export function calculatePoints(player: Player): number {
  let points = player.points;
  let coinPoints = Math.floor(player.coins/3)
  let militaryPoints = calculateMilitaryPoints(player.military)

  let scienceOptions: number = 0;
  if (player.optionalResources) {
    player.optionalResources.forEach((valueArray: [number, string][]) => {
      const resource = valueArray[0][1].toLowerCase();
      if (resource === 'gear' || resource === 'tablet' || resource === 'compass') {
        scienceOptions++;
      }
    })
  }
  let sciencePoints = calculateSciencePoints(player.resources, scienceOptions);

  let total = points + coinPoints + militaryPoints + sciencePoints;
  return total;
}

export function calculateMilitaryPoints(military: MilitaryStats): number {
  const { loss, one, three, five } = military;
  return -1*(loss) + (one) + 3*(three) + 5*(five);
}

export function calculateSciencePoints(resources: ResourceList, options: number): number {
  let sciencePoints = 0;
  const {gear, tablet, compass} = resources;
  sciencePoints += (gear*gear + tablet*tablet + compass*compass);
  sciencePoints += Math.min(gear, tablet, compass)*7;

  const addGear = {... resources, gear: gear + 1}
  const addTablet = {... resources, tablet: tablet + 1}
  const addCompass = {... resources, compass: compass + 1}
  if (options > 0) {
    sciencePoints = Math.max(
      calculateSciencePoints(addGear, options-1),
      calculateSciencePoints(addTablet, options-1),
      calculateSciencePoints(addCompass, options-1),
    )
  }

  return sciencePoints;
}

function sendTurnUpdate() {
  gameClients.forEach((client: any) => {
    const handID = game.players[client.id].handID;
    const hand = game.hands[handID];
    const player = game.gameData.playerData[client.id];
    if (hand) {
      const handInfo: any = {};
      hand.forEach((cardID: any) => {
        const buildOptions: BuildOptions = player.canBuild(cardID);
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
          options: player.canStage(),
        };
      game.players[client.id].handInfo = handInfo;
      game.players[client.id].stageInfo = stageInfo;
      pushUpdateToPlayers(JSON.stringify({ metadata: game.metadata, hand, handInfo, stageInfo }), 'turnUpdate', [client]);
    }
  });
}

function sendAllPlayerData() {
    pushUpdateToPlayers(JSON.stringify({ playerData: game.gameData.playerData }), 'allPlayerDataUpdate', gameClients);
}
  
export function sendPlayerData(username: string, sendToAll: boolean): void {
  gameClients.forEach((client: any) => {
    if (sendToAll || client.id === username) {
      pushUpdateToPlayers(JSON.stringify({ myData: game.gameData.playerData[client.id] }), 'playerDataUpdate', [client]);
    }
  });
}

export function beginAge(): void {
    const playerIDs = Object.keys(game.players);
    for (let i = 0; i < playerIDs.length; i++) {
      game.players[playerIDs[i]].handID = i;
    }
    generateHands(playerIDs.length);
    sendTurnUpdate();
    sendAllPlayerData();
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

    sendPlayerData(username, true);
    updateTurn();
    sendAllPlayerData();
  }
}

export function sum(a: number, b: number) : number {
    return a + b;
}