import { Board, Resource, CardTypeList, ResourceList, MilitaryStats, PlayerData, BuildOptions, ConditionData, PurchaseOptions, Card, StageOptions } from './playerData.model';
import { game } from './game.model'

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
  VALIDATION 
  ================================================= */ 

  canBuild(cardID: string): BuildOptions {
    const card = game.cards[cardID];

    // Is card free or is chain cost met ?
    if ((card.RESOURCE_COST.length === 0) || (this.isChainCostMet(card.CHAIN_COST))) {
     return {
        costMet: true,
        coinCost: 0,
        purchaseOptions: [{
          costLeft: 0,
          costRight: 0, 
          purchaseLeft: [],
          purchaseRight: [],
        }],
      }
    } else return this.checkCost(card.RESOURCE_COST);
  }

  canStage(): BuildOptions {
    let nextStage: {cost: any, value: any};
    if (this.stageData) {
      nextStage = this.stageData[this.stagesBuilt + 1];
    }
    if (this.stagesBuilt === 3) {
      return {costMet: false, coinCost: 0, purchaseOptions: []}
    }
    return this.checkCost(nextStage.cost);
  }

  checkCost(resourceCost: any): BuildOptions {
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
    // Is cost free?
    if ((resourceCost.length === 0)) {
      buildOptions.costMet = true;
      return buildOptions;
    }

    const coinCost = this.getCoinCost(resourceCost);
    if (coinCost > 0) {
      buildOptions.costMet = true;
      buildOptions.coinCost = coinCost;
    } else {

      // Can I afford to build? 
      let unmetCostArray: any = this.isResourceCostMet(resourceCost);
      if (unmetCostArray.length === 0) {
        buildOptions.costMet = true;      
      } else {
        // Can I purchase from my neighbours? 
        const bestPurchaseOptions: PurchaseOptions[]= this.checkPurchaseOptions(unmetCostArray);
        if (bestPurchaseOptions.length > 0) {
          buildOptions.costMet = true;
          buildOptions.coinCost = bestPurchaseOptions[0].costLeft + bestPurchaseOptions[0].costRight;
          buildOptions.purchaseOptions = bestPurchaseOptions;
          // console.log("Purchase required: ", buildOptions.coinCost, buildOptions.purchaseOptions[0])
        }
      }
    }
    // Can I afford the cost? 
    if (buildOptions.coinCost > this.coins) {
      buildOptions.costMet = false;
    }
    return buildOptions; 
  }

  isChainCostMet(chainCost: Array<any>) : boolean {
    for (let i = 0; i < chainCost.length; i++) {
      const cardID: any = chainCost[i];
      if (this.cards.includes(cardID)) {
        // console.log("Chain cost is met");
        return true;
      }
    }
    return false;
  }

  private getCoinCost(resourceCost: Array<any>): number {
    let coinCost = 0;
    resourceCost.forEach((resource: [number, string]) => {
      if (resource[1] === 'COIN') {
        coinCost = resource[0];
      }
    })
    return coinCost;
  }

  private isResourceCostMet(resourceCost: Array<any>) : Array<any>{
    let unmetCost: any[] = this.checkResources(resourceCost);
    
    if (unmetCost.length > 0) {
      unmetCost = this.checkAdditionalResources(unmetCost, this.optionalResources.concat(this.personalResources));
    }

    return unmetCost
  }

  private checkResources(resourceCost: Array<any>, values: ResourceList = this.resources) : Array<any>{
    const unmetCost: any[] = [];

    resourceCost.forEach((resource: [number, Resource ]) => {
      let numRequired = resource[0];
      numRequired -= values[resource[1].toLowerCase()];
      if (numRequired > 0) {
        unmetCost.push([numRequired, resource[1]]);
      } 
    })

    return unmetCost;
  }

  private checkAdditionalResources(resourceCost: Array<any>, allCards: any[]) : [number, string][][] {
    const unmetCostArray: any[] = [];
    const resources = resourceCost.map((resource: [number, string]) => {return resource[1]})
    const cards: any[] = [];
    allCards.forEach((valueArray: Array<[number, string]>) => {
      const newValues = valueArray.filter((resourceValue: [number, string]) => {
        if (resources.includes(resourceValue[1])) return resourceValue;
      })
      if (newValues.length > 0) cards.push(newValues);
    });

    if (cards.length === 0) return [resourceCost];
    let resourceLists: Array<[ResourceList, number]> = [];
    let initResources: ResourceList = new ResourceList(0);
    createResourceLists(initResources, 0);

    while (resourceLists.length > 0) {
      let list = resourceLists.pop();
      const unmetCost: any[] = this.checkResources(resourceCost, list[0])
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
  }

  private checkPurchaseOptions(unmetCostArray: [number, string][][]) : PurchaseOptions[] {
    let buildOptionsArray: BuildOptions[] = [];
    for (let i = 0; i< unmetCostArray.length; i++) {
      const purchaseOptions: [any[], PurchaseOptions] = this.checkNeighbourResources(unmetCostArray[i]);
      if (purchaseOptions[0].length === 0) {
        const buildOption = {
          costMet: true,
          coinCost: purchaseOptions[1].costLeft + purchaseOptions[1].costRight,
          purchaseOptions : [purchaseOptions[1]],
        }
        buildOptionsArray.push(buildOption);
      } else {
        // Check optional resources
        const left: Player = game.gameData.playerData[this.playerLeft];
        const right: Player = game.gameData.playerData[this.playerRight];
        let leftCards: object[] = (!left) ? [] :
          game.gameData.playerData[this.playerLeft].optionalResources.map((valueArray: [number, string]) => {
            return { player: 'left', value: valueArray }
          })
        let rightCards: object[] = (!right) ? [] :
          game.gameData.playerData[this.playerRight].optionalResources.map((valueArray: [number, string]) => {
            return { player: 'right', value: valueArray }
          })
        const result = this.checkNeighbourAdditionalResources(purchaseOptions[0], leftCards.concat(rightCards), purchaseOptions[1])
        buildOptionsArray = buildOptionsArray.concat(result);
      }
    }
    if (buildOptionsArray.length > 0) {
      let optimalPurchaseOptions: PurchaseOptions[] = [];
      let minCost = -1;
      buildOptionsArray.forEach((options: BuildOptions) => {
        if (options.coinCost <= minCost || minCost === -1) {
          if (options.coinCost < minCost) {
            minCost = options.coinCost;
            optimalPurchaseOptions = [];
          }
          optimalPurchaseOptions =  optimalPurchaseOptions.concat(options.purchaseOptions);
        }
      })
      return optimalPurchaseOptions
    } else return [];
  }

  private checkNeighbourResources(resourceCost: Array<any>) : [ any[], PurchaseOptions ] {
    const purchaseOptions: any = {
      purchaseRight: [],
      purchaseLeft: [],
      costRight: 0,
      costLeft: 0
    };
    const right: Player = game.gameData.playerData[this.playerRight]; 
    const left: Player = game.gameData.playerData[this.playerLeft];
    const unmetCost = []
    for (let i = 0; i < resourceCost.length; i++) {
      let numRequired = resourceCost[i][0];
      const resource = resourceCost[i][1].toLowerCase();

      const leftCost = this.purchaseCosts.playerLeft[resource]
      const rightCost = this.purchaseCosts.playerRight[resource]
      const leftMet = (left) ? left.resources[resource] : 0
      const rightMet = (right) ? right.resources[resource] : 0
      
      if (rightCost > leftCost) {
        if (rightMet >= numRequired) {
          purchaseOptions.purchaseRight.push([numRequired, resource]);
          purchaseOptions.costRight += rightCost*numRequired;
        } else {
          if (rightMet > 0) {
            numRequired -= rightMet;
            purchaseOptions.purchaseRight.push([rightMet, resource]);
            purchaseOptions.costRight += rightCost*rightMet;
          }
          if (leftMet >= numRequired) {
            purchaseOptions.purchaseLeft.push([numRequired, resource]);
            purchaseOptions.costLeft += leftCost*numRequired;
          } else {
            numRequired -= leftMet;
            unmetCost.push([numRequired, resourceCost[i][1]]);
          }
        }
      } else {
        if (leftMet >= numRequired) {
          purchaseOptions.purchaseLeft.push([numRequired, resource]);
          purchaseOptions.costLeft += leftCost*numRequired;
        } else {
          if (leftMet > 0) {
            numRequired -= leftMet;
            purchaseOptions.purchaseLeft.push([leftMet, resource]);
            purchaseOptions.costLeft += leftCost*leftMet;
          }
          if (rightMet >= numRequired) {
            purchaseOptions.purchaseRight.push([numRequired, resource]);
            purchaseOptions.costRight += rightCost*numRequired;
          } else {
            numRequired -= rightMet;
            unmetCost.push([numRequired, resourceCost[i][1]]);
          }
        }
      }
    }
    return [unmetCost, purchaseOptions];
  }

  private checkNeighbourAdditionalResources(resourceCost: any[], allCards: object[], initOptions: PurchaseOptions): BuildOptions[] {
    const result: BuildOptions[] = []
    const resources = resourceCost.map((resource: [number, string]) => {return resource[1]})
    const cards: any[] = [];
    allCards.forEach((card: {player: string, value: Array<[number, string]>}) => {
      const newValues = card.value.filter((resourceValue: [number, string]) => {
        if (resources.includes(resourceValue[1])) return resourceValue;
      })
      if (newValues.length > 0) cards.push({ ...card , value: newValues})
    })

    if (cards.length === 0) return []
    let resourceLists: Array<{list: ResourceList, cardIndex: number, purchaseOptions: PurchaseOptions}> = [];
    let initResources: ResourceList = new ResourceList(0);
    createResourceLists(initResources, 0, initOptions, this.purchaseCosts);

    while (resourceLists.length > 0) {
      let cardData = resourceLists.pop();
      const unmetCost: any[] = this.checkResources(resourceCost, cardData.list)
      if (unmetCost.length === 0) {
        const {purchaseOptions} = cardData;
        const buildOption: BuildOptions = {
          costMet: true,
          coinCost: purchaseOptions.costLeft + purchaseOptions.costRight,
          purchaseOptions: [purchaseOptions],
        }
        result.push(buildOption);
      } else {
        createResourceLists(cardData.list, cardData.cardIndex + 1, cardData.purchaseOptions, this.purchaseCosts);
      }
    }

    return result;

    function createResourceLists(list: ResourceList, cardIndex: number, purchaseOptions: PurchaseOptions, purchaseCosts: {playerLeft: ResourceList, playerRight: ResourceList}): void {
      const card: {player: 'right' | 'left' , value: Array<[number, string]>} = cards[cardIndex]; 
      if (card) {
        card.value.forEach((value: [number, string]) => {
          const newPurchaseOptions: PurchaseOptions = purchaseOptions;
          if (card.player === "right") {
            newPurchaseOptions.purchaseRight.push(value);
            newPurchaseOptions.costRight += purchaseCosts.playerRight[value[1].toLowerCase()];
          }
          else {
            newPurchaseOptions.purchaseLeft.push(value);
            newPurchaseOptions.costLeft += purchaseCosts.playerLeft[value[1].toLowerCase()];
          }
          let newList: ResourceList = Object.assign({}, list); 
          newList[value[1].toLowerCase()] += value[0];
          resourceLists.push({
            list: newList, 
            cardIndex,
            purchaseOptions: newPurchaseOptions});
        });
      }
    }      
  }

  /* =================================================
  CARD SELECTION
  ================================================= */ 

  buildStage(stageOptions: StageOptions, purchase: PurchaseOptions) {
    const data = this.stageData[stageOptions.stage];
    console.log(`Building stage ${stageOptions.stage}. Will receive ${data.value}`); 
    data.value.forEach((value: [number, string]) => {
      if (value[1] === 'POINT') {
        this.addPoints(value[0])
      } else if (value[1] === 'COIN') {
        this.addCoins(value[0])
      } else if (value[1] === 'SHIELD') {
        this.addShields(value[0])
      } else if (Object.keys(this.resources).includes(value[1].toLowerCase())) {
        this.addResources([value]);
      }
      else console.log("Couldn't build " + data.value);
    })
    this.stagesBuilt += 1;
    this.coins -= stageOptions.options.coinCost;
    this.executePurchase(purchase);
  }

  selectCard(cardID: string, coinCost: number, purchaseOptions: PurchaseOptions): ConditionData[] {
    const card: Card = game.cards[cardID];
    this.cardTypes[card.CATEGORY.toLowerCase()].push(cardID);
    this.cards.push(cardID);
    let condData: ConditionData[];
    if (card.VALUE_TYPE === "AND") {
      this.buildAndCard(card);
    } else if (card.VALUE_TYPE === "OR") {
      this.buildOrCard(card);
    } else if (card.VALUE_TYPE === "CONDITION") {
      condData = this.buildConditionCard(card);
    } else if (card.VALUE_TYPE === "DISCOUNT") {
      this.buildDiscountCard(card);
    }
    this.coins -= coinCost;
    this.executePurchase(purchaseOptions);
    // return condition to be redeemed at end of turn
    return condData;
  }

  receivePay(cost: number, username: string) {
    this.coins += cost;
    console.log(`Player ${this.username} received ${cost} coins from ${username} and now has ${this.coins} coins`);
  }

  discard(card: string) {
    game.gameData.discardPile.push(card);
    this.coins += 3;
    console.log('coins: ' + this.coins);
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
      if (leftDiscount) {
        this.purchaseCosts.playerLeft[resource.toLowerCase()] = 1;
      }
      if (rightDiscount) {
        this.purchaseCosts.playerRight[resource.toLowerCase()] = 1;
      }
    })
  }

  private buildConditionCard(card: Card): ConditionData[] {
    const value = card.VALUE;
    const resources = value[2];
    const newResources: any[] = [];
    let result: ConditionData[] = [];
    resources.forEach((resource: [number, string]) => {
      if (resource[1]==='COIN') {
        result.push({category: value[0], player: value[1], value: [resource]})
      } else {
        newResources.push(resource);
      }
    })
    const data: ConditionData = {category: value[0], player: value[1], value: newResources}
    this.conditionalResources.push(data);
    return result;
  }
  
  redeemCondition(conditionData: ConditionData) {
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
    console.log(`Earned ${values.coins} coins and ${values.points} points`);
  }
  
  private buildOrCard(card: Card) {
    if (card.CATEGORY === 'BROWN' || card.CATEGORY === 'GRAY' || card.CATEGORY === 'PURPLE') {
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

  private addResources(cardValue: Array<[number, string]>) {
    cardValue.forEach((value: [number, string]) => {
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
