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

  /* =======================
  VALIDATION 
  ======================= */   

  canBuild(cardID: string): BuildOptions {
    const buildOptions: BuildOptions = {
      costMet: false,
      coinCost: 0,
      purchaseOptions: [{
        costLeft: 0,
        costRight: 0, 
        purchaseLeft: [],
        purchaseRight: [],
      }],
    }
    const card = game.cards[cardID];
    console.log(card.CARD_ID + " " + card.NAME);

    // Is card free or is chain cost met ?
    if ((card.RESOURCE_COST.length === 0) || (this.isChainCostMet(card.CHAIN_COST))) {
      buildOptions.costMet = true;
      return buildOptions;
    }

    // TODO Check if resource cost includes any coins => cost
    // buildOptions.coinCost = cost
    // buildOptions.costMet = cost > this.coins)

    // Can I afford to build? 
    let unmetCostArray: any = this.isResourceCostMet(card.RESOURCE_COST);
    if (unmetCostArray.length === 0) {
      buildOptions.costMet = true;
      buildOptions.coinCost = this.getCoinCost(card.RESOURCE_COST);

    // Can I purchase from my neighbours? 
    // } else {
    //   const bestPurchaseOption: [boolean, PurchaseOptions]= this.checkPurchaseOptions(unmetCostArray);
    //   if (bestPurchaseOption[0]) {
    //     buildOptions.costMet = true;
    //     buildOptions.coinCost = bestPurchaseOption[1].costLeft + bestPurchaseOption[1].costRight;
    //     buildOptions.purchaseOptions = bestPurchaseOption[1];
    //   }
    }

    // Can I afford the cost? 
    if (buildOptions.coinCost > this.coins) {
      buildOptions.costMet = false;
    }

    return buildOptions;
  }
  
  private checkPurchaseOptions(unmetCostArray: any) : [boolean, PurchaseOptions] {
    const buildOptionsArray: BuildOptions[] = [];
      for (let i = 0; i< unmetCostArray.length; i++) {
        // unmetCost => Check if it includes coins 
        const purchaseOptions: [any[], PurchaseOptions] = this.checkNeighbourResources(unmetCostArray[i]);
        if (purchaseOptions[0].length > 0) {
          console.log("Can't purchase , unmet resources : " + purchaseOptions[0][0] + " ... ")
          const leftCards: object[]= game.gameData.playerData[this.playerLeft].optionalResources.map((valueArray: [number, string]) => {
            return {
              player: 'left',
              value: valueArray,
            }
          })
          const rightCards: object[] = game.gameData.playerData[this.playerRight].optionalResources.map((valueArray: [number, string]) => {
            return {
              player: 'right',
              value: valueArray,
            }
          })
          const result = this.checkNeighbourAdditionalResources(purchaseOptions[0], leftCards.concat(rightCards)) // => PurchaseOption[]
          buildOptionsArray.concat(result);
        } else {
          const buildOption = {
            costMet: true,
            coinCost: purchaseOptions[1].costLeft + purchaseOptions[1].costRight,
            purchaseOptions : [purchaseOptions[1]],
          }
          buildOptionsArray.push(buildOption);
        }
      }
      if (buildOptionsArray.length > 0) {
        // TODO return optimal buildOption
        return [true, {
          costLeft: 0,
          costRight: 0, 
          purchaseLeft: [],
          purchaseRight: [],
        }]
      } else return [false, {
        costLeft: 0,
        costRight: 0, 
        purchaseLeft: [],
        purchaseRight: [],
      }]
  }

  private checkNeighbourResources(unmetCost: Array<any>) : [ any[], PurchaseOptions ] {
    const purchaseOptions: any = {
      purchaseRight: [],
      purchaseLeft: [],
      costRight: 0,
      costLeft: 0
    };
    const right: Player = game.gameData.playerData[this.playerRight]; 
    const left: Player = game.gameData.playerData[this.playerLeft];
    const stillUnmetCost = []
    for (let i = 0; i < unmetCost.length; i++) {
      let numRequired = unmetCost[i][0];
      const resource = unmetCost[i][1].toLowerCase();

      // TODO lifted to canBuild, remove coin check
      if (resource === 'COIN') {
        stillUnmetCost.push(unmetCost[i]);
        return [stillUnmetCost, purchaseOptions]
      }

      const leftCost = this.purchaseCosts.playerLeft[resource]
      const rightCost = this.purchaseCosts.playerRight[resource]
      const leftMet = (left) ? left.resources[resource] : 0
      const rightMet = (right) ? right.resources[resource] : 0
      
      if (rightCost > leftCost) {
        if (rightMet >= numRequired) {
          purchaseOptions.purchaseRight.push([numRequired, resource]);
          purchaseOptions.costRight += rightCost*numRequired;
        } else {
          numRequired -= rightMet;
          purchaseOptions.purchaseRight.push([rightMet, resource]);
          purchaseOptions.costRight += rightCost*rightMet;
          if (leftMet >= numRequired) {
            purchaseOptions.purchaseLeft.push([numRequired, resource]);
            purchaseOptions.costLeft += leftCost*numRequired;
          } else {
            stillUnmetCost.push([numRequired, unmetCost[i][1]]);
          }
        }
      } else {
        if (leftMet >= numRequired) {
          purchaseOptions.purchaseLeft.push([numRequired, resource]);
          purchaseOptions.costLeft += leftCost*numRequired;
        } else {
          numRequired -= leftMet;
          purchaseOptions.purchaseLeft.push([leftMet, resource]);
          purchaseOptions.costLeft += leftCost*leftMet;
          if (rightMet >= numRequired) {
            purchaseOptions.purchaseRight.push([numRequired, resource]);
            purchaseOptions.costRight += rightCost*numRequired;
          } else {
            stillUnmetCost.push([numRequired, unmetCost[i][1]]);
          }
        }
      }
    }
    return [stillUnmetCost, purchaseOptions];
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

  private isResourceCostMet(resourceCost: Array<any>) : Array<any>{
    let unmetCost: any[] = this.checkResources(resourceCost);
    
    if (unmetCost.length > 0) {
      unmetCost = this.checkAdditionalResources(unmetCost, this.optionalResources.concat(this.personalResources));
    }

    return unmetCost
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

  //TODO search function
  private checkNeighbourAdditionalResources(resourceCost: any[], allCards: object[]): BuildOptions[] {
    // allCardsArray = [
    //   card = {
    //     player: left,
    //     valueArray: [[Q, R], [Q, R]]
    //   }
    //   card = {
    //     player: left,
    //     valueArray: [[Q, R], [Q, R]]
    //   }
    //   card = {
    //     player: right,
    //     valueArray: [[Q, R], [Q, R]]
    //   }
    //   card = {
    //     player: right,
    //     valueArray: [[Q, R], [Q, R]]
    //   }
    // ]
    // Compute costs
    return [];
  }

  private checkAdditionalResources(resourceCost: Array<any>, allCards: any[]) : Array<any> {
    const unmetCostArray: any[] = [];
    const resources = resourceCost.map((resource: [number, string]) => {return resource[1]})
    const cards: any[] = [];
    allCards.forEach((valueArray: Array<[number, string]>) => {
      const newValues = valueArray.filter((resourceValue: [number, string]) => {
        if (resources.includes(resourceValue[1])) return resourceValue;
      })
      if (newValues.length > 0) cards.push(newValues);
    });

    if (cards.length === 0) return resourceCost;
    let resourceLists: Array<[ResourceList, number]> = [];
    let initResources: ResourceList = new ResourceList(0);
    createResourceLists(initResources, 0);

    while (resourceLists.length > 0) {
      let list = resourceLists.pop();
      const unmetCost: any[] = checkResourceList(resourceCost, list[0])
      if (unmetCost.length === 0) {
        return [];
      } else {
        unmetCostArray.push(unmetCost);
        createResourceLists(list[0], list[1] + 1);
      }
    }
    return unmetCostArray;

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

    function checkResourceList(resourceCost: Array<any>, values: ResourceList): any[] {
      const unmetCost: any = [];
      resourceCost.forEach((resource: [number, Resource]) => {
        let numRequired = resource[0];
        numRequired -= values[resource[1].toLowerCase()];
        if (numRequired > 0) unmetCost.push([numRequired, resource[1]]);
      })
      return (unmetCost);
    }         
  }

  /* =======================
  CARD SELECTION
  ======================= */ 

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
      this.buildDiscountCard(card);
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

  private buildDiscountCard(card: Card) {
    const value = card.VALUE;
    const leftDiscount = value[0].includes('LEFT');
    const rightDiscount = value[0].includes('RIGHT');
    const resources = value[1];
    resources.forEach((resource: string) => {
      if (leftDiscount) {
        this.purchaseCosts.playerLeft[resource.toLowerCase()] = 1;
      }
      if (rightDiscount) {
        this.purchaseCosts.playerRight[resource.toLowerCase()] = 1;
      }
    })
  }

  private buildConditionCard(card: Card) {
    const value = card.VALUE;
    const resources = value[2];
    const newResources: any[] = [];
    resources.forEach((resource: [number, string]) => {
      if (resource[1]==='COIN') {
        const data: ConditionData = {category: value[0], player: value[1], value: [resource]}
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
