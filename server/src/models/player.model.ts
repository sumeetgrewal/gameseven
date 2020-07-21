import { Board, Resource, CardTypeList, ResourceList, MilitaryStats, PlayerData, BuildOptions, ConditionData, PurchaseOptions, Card } from './playerData.model';
import { game } from './game.model'

export class Player implements PlayerData {
  username: string;
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
  purchaseCosts: {
    playerLeft: ResourceList;
    playerRight: ResourceList;
  }

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
    this.discounts = [];
    this.military = {
        loss: 0,
        one: 0,
        three: 0,
        five: 0,
    }
    this.purchaseCosts = {
      playerLeft : new ResourceList(2),
      playerRight : new ResourceList(2),
    }
    if (board) {
       this.personalResources.push([[1, this.board.RESOURCE]]);
    }
  }

  // ---- VALIDATION
  canBuild(cardID: string): BuildOptions {
    const buildOptions: BuildOptions = {
      costMet: false,
      coinCost: 0,
      purchaseOptions: {
        costLeft: 0,
        costRight: 0, 
        purchaseLeft: [],
        purchaseRight: [],
      },
    }
    const card = game.cards[cardID];
    console.log(card.CARD_ID + " " + card.NAME);
    buildOptions.costMet = ((card.RESOURCE_COST.length === 0) 
      || (this.isChainCostMet(card.CHAIN_COST))
      || (this.isResourceCostMet(card.RESOURCE_COST))) 

    if ((card.RESOURCE_COST.length === 0) || (this.isChainCostMet(card.CHAIN_COST))) {
      buildOptions.costMet = true;
    } else if (this.isResourceCostMet(card.RESOURCE_COST)) {
      buildOptions.costMet = true;
      buildOptions.coinCost = this.getCoinCost(card.RESOURCE_COST);
    } else {
      const purchaseOptions: [boolean, PurchaseOptions] = this.checkPurchaseOptions(card.RESOURCE_COST);
      if (purchaseOptions[0]) {
        buildOptions.costMet = true;
        buildOptions.coinCost = purchaseOptions[1].costLeft + purchaseOptions[1].costRight;
        buildOptions.purchaseOptions = purchaseOptions[1];
      }
    }
    if (buildOptions.coinCost >= this.coins) {
      buildOptions.costMet = false;
    }

    return buildOptions;
  }
  
  // TODO create purchase options
  // Check optional resources

  private checkPurchaseOptions(unmetCost: Array<any>) : [ boolean, PurchaseOptions ] {
    const purchaseOptions: any = {
      purchaseRight: [],
      purchaseLeft: [],
      costRight: 0,
      costLeft: 0
    };
    const right: Player = game.gameData.playerData[this.playerRight]; 
    const left: Player = game.gameData.playerData[this.playerLeft];
    for (let i = 0; i < unmetCost.length; i++) {
      let numRequired = unmetCost[i][0];
      const resource = unmetCost[i][1].toLowerCase();
      if (resource === 'COIN') return [false, purchaseOptions]

      const leftCost = this.purchaseCosts.playerLeft[resource]
      const rightCost = this.purchaseCosts.playerRight[resource]
      const leftMet = (left) ? left.resources[resource] : 0
      const rightMet = (right) ? right.resources[resource] : 0

      if (rightCost > leftCost) {
        if (rightMet >= numRequired) {
          addResources('Right', numRequired, rightCost, resource);
        } else {
          numRequired -= rightMet;
          addResources('Right', rightMet, rightCost, resource);
          if (leftMet >= numRequired) {
            addResources('Left', numRequired, leftCost, resource);
          } else {
            return [false, purchaseOptions];
          }
        }
      } else {
        if (leftMet >= numRequired) {
          addResources('Left', numRequired, leftCost, resource);
        } else {
          numRequired -= leftMet;
          addResources('Left', leftMet, leftCost, resource);
          if (rightMet >= numRequired) {
            addResources('Right', numRequired, rightCost, resource);
          } else {
            return [false, purchaseOptions];
          }
        }
      }
    }
    return [true, purchaseOptions];

    function addResources(player: string, quantity: number, cost: number, resource: string) {
      purchaseOptions['purchase' + player].push([quantity, resource]);
      purchaseOptions['cost' + player] += cost*quantity;
    }
  }

  getCoinCost(resourceCost: Array<any>): number {
    let coinCost = 0;
    resourceCost.forEach((resource: [number, string]) => {
      if (resource[1] === 'COIN') {
        coinCost = resource[0];
      }
    })
    return coinCost;
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
    let initResources: ResourceList = new ResourceList(0);
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

  // ---- CARD SELECTION
  selectCard(cardID: string, coinCost: number, purchaseOptions: PurchaseOptions) {
    const card: Card = game.cards[cardID];
    this.cardTypes[card.CATEGORY.toLowerCase()].push(cardID);
    this.cards.push(cardID);
    if (card.VALUE_TYPE === "AND") {
      this.buildAndCard(card);
    } else if (card.VALUE_TYPE === "OR") {
      this.buildOrCard(card);
    } else if (card.VALUE_TYPE === "CONDITION") {
      this.buildConditionCard(card);
    } else if (card.VALUE_TYPE === "DISCOUNT") {
      this.discounts.push(card.VALUE);
    }
    this.coins -= coinCost;
    this.executePurchase(purchaseOptions);
  }

  private executePurchase(purchaseOptions: PurchaseOptions) {
    const {costLeft, costRight} = purchaseOptions;
    if (costLeft > 0) game.gameData.playerData[this.playerLeft].receivePay(costLeft, this.username);
    if (costRight > 0) game.gameData.playerData[this.playerRight].receivePay(costRight, this.username);
  }

  public receivePay(cost: number, username: string) {
    this.coins += cost;
    console.log(`Player ${this.username} received ${cost} coins from ${username}`);
  }

  discard() {
    this.coins += 3;
    console.log('coins: ' + this.coins);
  }
  
  private buildConditionCard(card: Card) {
    const value = card.VALUE;
    const resources = value[2];
    const newResources: any[] = [];
    resources.forEach((resource: [number, string]) => {
      if (resource[1]==='COIN') {
        const data: ConditionData = {category: value[0], player: value[1], value: value[2]}
        this.redeemCondition(data);
      } else {
        newResources.push(resource);
      }
    })
    const data: ConditionData = {category: value[0], player: value[1], value: newResources}
    this.conditionalResources.push(data);
  }
  
  private redeemCondition(conditionData: ConditionData) {
    console.log(conditionData);
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
              // TODO
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
    console.log(`Earned ${values.coins} coins and ${values.points} points`);
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
      this.addShields(card.VALUE[0][0]);
    }
    else if (card.CATEGORY === 'BLUE') {
      this.addPoints(card.VALUE[0][0]);
    }
    else if (card.CATEGORY === 'YELLOW') {
      this.addCoins(card.VALUE[0][0]);
    }
  }

  private addResources(cardValue: Array<[number, Resource]>) {
    cardValue.forEach((value: [number, Resource]) => {
      const resource: string = value[1].toLowerCase();
      this.resources[resource] += value[0];
    })
    console.log(this.resources);
  }

  private addShields(numShields: number) {
    this.shields += numShields;
    console.log('shields: ' + this.shields)
  }

  private addPoints(numPoints: number) {
    this.points += numPoints;
    console.log('points: ' + this.points)
  }

  private addCoins(numCoins: number) {
    this.coins += numCoins;
    console.log('coins: ' + this.coins)
  }
}
