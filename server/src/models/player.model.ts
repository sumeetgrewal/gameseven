import { Board, Resource, CardTypeList, ResourceList, MilitaryStats, PlayerData, Card } from './playerData.model';
import { game } from './game.model'

export class Player implements PlayerData {
  board: Board | undefined;
  cards: Array<string>;
  cardTypes: CardTypeList;
  resources: ResourceList;
  coins: number;
  shields: number;
  points?: number;
  optionalResources?: Array<any>;
  personalResources?: Array<any>;
  military?: MilitaryStats;
  conditionalResources?: Array<any>;
  discounts?: Array<any>;

  constructor(board: Board | undefined = undefined) {
    this.board = board;
    this.cards = [];
    this.cardTypes = {
      brown: [],
      gray: [],
      blue: [],
      green: [],
      red: [],
      yellow: [],
      purple: [],
    };
    this.resources = {
      wood: 0,
      ore: 0,
      stone: 0,
      clay: 0,
      glass: 0,
      papyrus: 0,
      loom: 0,
      compass: 0,
      tablet: 0,
      gear: 0,
    };
    this.coins = 3;
    this.shields = 0;
    this.points = 0;
    this.optionalResources = [];
    this.personalResources = [];
    this.conditionalResources = [];
    this.discounts = [];
    this.military = {
        loss: 0,
        one: 0,
        three: 0,
        five: 0,
    }
  }

  // TODO validate card selection 
  canBuild(cardID: string): boolean {
    const card = game.cards[cardID];
    const resourceCost = card.RESOURCE_COST;
    const unmetCost: any[]= [];
    console.log(card);
    if (resourceCost.length === 0) return true;
    resourceCost.forEach((resource: [number, Resource | "COIN"]) => {
      let numRequired = resource[0];
      if (resource[1] === 'COIN') {
        numRequired -= this.coins;
      } else {
        numRequired -= this.resources[resource[1].toLowerCase()];
      }
      if (numRequired > 0) {
        unmetCost.push(resource);
      } 
    })
    console.log(unmetCost); 
    if (unmetCost.length === 0) {
      return true;
    }
    // TODO Check optional resources (DFS)
    // TODO Check personal resources (DFS)
    // TODO Check purchase options and discounts
    return false;
  }

  selectCard(cardID: string) {
    const card: Card = game.cards[cardID];
    this.cardTypes[card.CATEGORY.toLowerCase()].push(cardID);
    this.cards.push(cardID);
    if (card.VALUE_TYPE === "AND") {
      this.buildAndCard(card);
    } else if (card.VALUE_TYPE === "OR") {
      this.buildOrCard(card);
    } else if (card.VALUE_TYPE === "CONDITION") {
      // TODO
    } else if (card.VALUE_TYPE === "DISCOUNT") {
      this.discounts.push(card.VALUE);
    }
  }

  private buildOrCard(card: Card) {
    if (card.CATEGORY === 'BROWN' || card.CATEGORY === 'GRAY') {
      this.optionalResources.push(card.VALUE);
      console.log(this.optionalResources);
    }
    else {
      this.personalResources.push(card.VALUE);
      console.log(this.personalResources);
    }
  }

  private buildAndCard(card: Card) {
    if (['BROWN', 'GRAY', 'GREEN'].includes(card.CATEGORY)) {
      this.addResources(card.VALUE);
    }
    else if (card.CATEGORY === 'RED') {
      this.addShields(card.VALUE);
    }
    else if (card.CATEGORY === 'BLUE') {
      this.addPoints(card.VALUE);
    }
    else if (card.CATEGORY === 'YELLOW') {
      this.addCoins(card.VALUE);
    }
  }

  private addResources(cardValue: Array<[number, Resource]>) {
    cardValue.forEach((value: [number, Resource]) => {
      const resource: string = value[1].toLowerCase();
      this.resources[resource] += value[0];
    })
    console.log(this.resources);
  }

  private addShields(cardValue: Array<[number, Resource]>) {
    const numShields = cardValue[0][0];
    this.shields += numShields;
    console.log('shields: ' + this.shields)
  }

  private addPoints(cardValue: Array<[number, Resource]>) {
    const numPoints = cardValue[0][0];
    this.points += numPoints;
    console.log('points: ' + this.points)
  }

  private addCoins(cardValue: Array<[number, Resource]>) {
    const numShields = cardValue[0][0];
    this.shields += numShields;
    console.log('coins: ' + this.coins)
  }
}