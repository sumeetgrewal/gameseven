import { Board, CardTypeList, ResourceList, MilitaryStats, PlayerData, ConditionData, PurchaseOptions, Card, StageOptions } from './playerData.model';
import { game } from './game.model'
import { addToFeed } from '../middleware/gameFeed';

export class Player implements PlayerData {
  username: string;
  board: Board | undefined;
  cards: Array<string>;
  cardTypes: CardTypeList;
  resources: ResourceList;
  coins: number;
  shields: number;
  points: number;
  optionalResources?: Array<any>;
  personalResources?: Array<any>;
  conditionalResources?: Array<any>;
  military: MilitaryStats;
  stagesBuilt: number;
  playerLeft?: string;
  playerRight?: string;
  purchaseCosts: {
    playerLeft: ResourceList;
    playerRight: ResourceList;
  }
  stageData?: {[id: number] : {cost: any, value: any}};
  score: number;

  constructor(username: string, board: Board | undefined = undefined) {
    this.username = username;
    this.board = board;
    this.cards = [];
    this.cardTypes = new CardTypeList();
    this.resources = new ResourceList(0)
    this.coins = 3;
    this.shields = 0;
    this.points = 0;
    this.optionalResources = [];
    this.personalResources = [];
    this.conditionalResources = [];
    this.military = {
        loss: 0,
        one: 0,
        three: 0,
        five: 0,
    }
    this.score = -1;
    this.stagesBuilt = 0;
    this.purchaseCosts = {
      playerLeft : new ResourceList(2),
      playerRight : new ResourceList(2),
    }
    if (board) {
       this.personalResources.push([[1, this.board.RESOURCE]]);
       this.stageData = {
          1 : {cost: board.S1_COST, value: board.S1_VALUE},
          2 : {cost: board.S2_COST, value: board.S2_VALUE},
          3 : {cost: board.S3_COST, value: board.S3_VALUE}
       }
    }
  }

  /* =================================================
  CARD SELECTION
  ================================================= */ 

  buildStage(stageOptions: StageOptions, purchase: PurchaseOptions) {
    const data = this.stageData[stageOptions.stage];
    addToFeed(this.username, 'stage', `${this.username} built stage ${stageOptions.stage}`, {stage: stageOptions.stage});
    data.value.forEach((value: [number, string]) => {
      (value[1] === 'POINT') ? this.addPoints(value[0]) 
      : (value[1] === 'COIN') ? this.addCoins(value[0])
      : (value[1] === 'SHIELD') ? this.addShields(value[0])
      : (Object.keys(this.resources).includes(value[1].toLowerCase())) ? this.addResources([value])
      : console.log("Couldn't build " + data.value);
    })
    this.stagesBuilt += 1;
    this.coins -= stageOptions.options.coinCost;
    this.executePurchase(purchase);
  }

  selectCard(cardId: string, coinCost: number, purchaseOptions: PurchaseOptions): ConditionData[] {
    const card: Card = game.cards[cardId];
    let condData: ConditionData[];
    
    this.cardTypes[card.CATEGORY.toLowerCase()].push(cardId);
    this.cards.push(cardId);
    
    (card.VALUE_TYPE === "AND") ? this.buildAndCard(card)
    : (card.VALUE_TYPE === "OR") ? this.buildOrCard(card)
    : (card.VALUE_TYPE === "CONDITION") ? condData = this.buildConditionCard(card)
    : (card.VALUE_TYPE === "DISCOUNT") ? this.buildDiscountCard(card) : '';

    let message = `${this.username} built ${card.NAME} ${coinCost > 0 ? `for ${coinCost} coins` : ''}`;
    addToFeed(this.username, 'build', message, {cardId})
    this.coins -= coinCost;
    this.executePurchase(purchaseOptions);
    return condData;
  }

  receivePay(cost: number, username: string) {
    this.coins += cost;
    addToFeed(this.username, 'payment',`${this.username} received ${cost} coins from ${username}`)
  }

  discard(card: string) {
    game.gameData.discardPile.push(card);
    this.coins += 3;
    addToFeed(this.username, 'discard', `${this.username} discarded a card and received 3 coins`);
  }

  private executePurchase(purchaseOptions: PurchaseOptions) {
    const {costLeft, costRight} = purchaseOptions;
    if (costLeft > 0) game.gameData.playerData[this.playerLeft].receivePay(costLeft, this.username);
    if (costRight > 0) game.gameData.playerData[this.playerRight].receivePay(costRight, this.username);
  }

  private buildDiscountCard(card: Card) {
    const value = card.VALUE;
    const leftDiscount = value[0].includes('LEFT');
    const rightDiscount = value[0].includes('RIGHT');
    const resources = value[1];
    resources.forEach((resource: string) => {
      if (leftDiscount) this.purchaseCosts.playerLeft[resource.toLowerCase()] = 1;
      if (rightDiscount) this.purchaseCosts.playerRight[resource.toLowerCase()] = 1;
    })
  }

  private buildConditionCard(card: Card): ConditionData[] {
    const value = card.VALUE;
    const resources = value[2];
    const newResources: any[] = [];
    let result: ConditionData[] = [];
    resources.forEach((resource: [number, string]) => {
      if (resource[1]==='COIN') {
        result.push({cardId: card.CARD_ID, category: value[0], player: value[1], value: [resource]})
      } else {
        newResources.push(resource);
      }
    })
    const data: ConditionData = {cardId: card.CARD_ID, category: value[0], player: value[1], value: newResources}
    this.conditionalResources.push(data);
    return result;
  }
  
  redeemCondition(conditionData: ConditionData) {
    const values = {
      coins: 0,
      points: 0,
    }
    let total: number = 0;
    conditionData.player.forEach((player) =>  {
      let playerData: PlayerData;
      switch (player) {
        case "SELF": playerData = this; break;
        case "LEFT" : playerData = game.gameData.playerData[this.playerLeft]; break;
        case "RIGHT" : playerData = game.gameData.playerData[this.playerRight]; break;
      }
      if (playerData) {
        conditionData.category.forEach((category: string) => {
          let count = 0;
          switch (category) {
            case 'MILITARY_LOSS': 
              count += playerData.military.loss
              break;
            case 'STAGE': 
              count += playerData.stagesBuilt
            default:
              const cardType: Array<string> = playerData.cardTypes[category.toLowerCase()];
              if (cardType) count += cardType.length;
              break;
          }
          total += count;
        })
      }
    })
    conditionData.value.forEach((value: [number, 'POINT' | 'COIN']) => {
      if (value[1] === 'POINT') {
        values.points += value[0]*total;
      } else if (value[1] === 'COIN') {
        values.coins += value[0]*total;
      }
    })
    this.addCoins(values.coins);
    this.addPoints(values.points);

    const cardName = game.cards[conditionData.cardId].NAME;
    let message = (values.coins > 0 && values.points > 0) ? 
        `${this.username} earned ${values.coins} coins and ${values.points} points from ${cardName}`
      : (values.coins > 0) ? 
        `${this.username} earned ${values.coins} coins from ${cardName}`
      : (values.points > 0) ? `${this.username} earned ${values.points} points from ${cardName}`
      : ''
    if (message !== '') addToFeed(this.username, 'condition', message, {cardId: `${conditionData.cardId}`});
  }
  
  private buildOrCard(card: Card) {
    if (card.CATEGORY === 'BROWN' || card.CATEGORY === 'GRAY' || card.CATEGORY === 'PURPLE') {
      this.optionalResources.push(card.VALUE);
    }
    else {
      this.personalResources.push(card.VALUE);
    }
  } 

  private buildAndCard(card: Card) {
    if (['BROWN', 'GRAY', 'GREEN'].includes(card.CATEGORY)) {
      this.addResources(card.VALUE);
    }
    else if (card.CATEGORY === 'RED') {
      this.addShields(card.VALUE[0][0]);
    }
    else if (card.CATEGORY === 'BLUE') {
      this.addPoints(card.VALUE[0][0]);
    }
    else if (card.CATEGORY === 'YELLOW') {
      this.addCoins(card.VALUE[0][0]);
    }
  }

  private addResources(cardValue: Array<[number, string]>) {
    cardValue.forEach((value: [number, string]) => {
      const resource: string = value[1].toLowerCase();
      this.resources[resource] += value[0];
    })
  }

  private addShields(numShields: number) {
    this.shields += numShields;
    console.log(`${this.username} shields: ${this.shields}`)
  }

  private addPoints(numPoints: number) {
    this.points += numPoints;
    console.log(`${this.username} points: ${this.points}`)
  }

  private addCoins(numCoins: number) {
    this.coins += numCoins;
    console.log(`${this.username} coins: ${this.coins}`)
  }
}
