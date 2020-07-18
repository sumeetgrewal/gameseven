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
  playerLeft?: string;
  playerRight?: string;

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

  // ---- VALIDATION
  canBuild(cardID: string): boolean {
    const card = game.cards[cardID];
    console.log(card.CARD_ID + " " + card.NAME);
    return ((card.RESOURCE_COST.length === 0) 
      || (this.isChainCostMet(card.CHAIN_COST))
      || (this.isResourceCostMet(card.RESOURCE_COST))) 
  }

  private isChainCostMet(chainCost: Array<any>) : boolean {
    for (let i = 0; i < chainCost.length; i++) {
      const cardID: any = chainCost[i];
      if (this.cards.includes(cardID)) {
        console.log("Chain cost is met");
        return true;
      }
    }
    return false;
  }

  private isResourceCostMet(resourceCost: Array<any>) : boolean{
    let unmetCost: any[] = this.checkResources(resourceCost);

    return((unmetCost.length === 0)
          || this.checkAdditionalResources(unmetCost))
  }

  private checkResources(resourceCost: Array<any>) : Array<any>{
    const unmetCost: any[] = [];

    resourceCost.forEach((resource: [number, Resource | "COIN"]) => {
      let numRequired = resource[0];
      if (resource[1] === 'COIN') {
        numRequired -= this.coins;
      } else {
        numRequired -= this.resources[resource[1].toLowerCase()];
      }
      if (numRequired > 0) {
        unmetCost.push([numRequired, resource[1]]);
      } 
    })

    return unmetCost;
  }

  private checkAdditionalResources(resourceCost: Array<any>) : boolean {
    const allCards: any[] = this.optionalResources.concat(this.personalResources);
    const resources = resourceCost.map((resource: [number, string]) => {return resource[1]})
    const cards: any[] = [];
    allCards.forEach((valueArray: Array<[number, string]>) => {
      const newValues = valueArray.filter((resourceValue: [number, string]) => {
        if (resources.includes(resourceValue[1])) return resourceValue;
      })
      if (newValues.length > 0) cards.push(newValues);
    });

    if (cards.length === 0) return false;
    let resourceLists: Array<[ResourceList, number]> = [];
    let initResources: ResourceList = {
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
    createResourceLists(initResources, 0);

    while (resourceLists.length > 0) {
      let list = resourceLists.pop();
      if (checkResourceList(resourceCost, list[0])) {
        return true;
      } else {
        createResourceLists(list[0], list[1] + 1);
      }
    }
    return false;

    function createResourceLists(list: ResourceList, cardIndex: number): void {
      const card: Array<[number, string]> = cards[cardIndex]; 
      if (card) {
        card.forEach((value: [number, string]) => {
          let newList: ResourceList = Object.assign({}, list); 
          newList[value[1].toLowerCase()] += value[0];
          resourceLists.push([newList, cardIndex]);
        });
      }
    }

    function checkResourceList(resourceCost: Array<any>, values: ResourceList): boolean {
      const unmetCost: any = [];
      resourceCost.forEach((resource: [number, Resource]) => {
        let numRequired = resource[0];
        numRequired -= values[resource[1].toLowerCase()];
        if (numRequired > 0) unmetCost.push([numRequired, resource[1]]);
      })
      return (unmetCost.length === 0);
    }         
  }

  // TODO create purchase options
  // Check if neighbour has resources required
  // Compute cost including discounts
  private checkPurchaseOptions(resourceCost: Array<any>) : any {
  }

  // ---- CARD SELECTION
  selectCard(cardID: string) {
    const card: Card = game.cards[cardID];
    this.cardTypes[card.CATEGORY.toLowerCase()].push(cardID);
    this.cards.push(cardID);
    // TODO if cost includes coin, deduct from total
    if (card.VALUE_TYPE === "AND") {
      this.buildAndCard(card);
    } else if (card.VALUE_TYPE === "OR") {
      this.buildOrCard(card);
    } else if (card.VALUE_TYPE === "CONDITION") {
      // TODO Check if resource is coin, then add coins, else add to condRes array
      this.conditionalResources.push(card.VALUE);
    } else if (card.VALUE_TYPE === "DISCOUNT") {
      this.discounts.push(card.VALUE);
    }
  }

  discard() {
    this.coins += 3;
    console.log(this.coins);
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
    const numCoins = cardValue[0][0];
    this.coins += numCoins;
    console.log('coins: ' + this.coins)
  }
}
