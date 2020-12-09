import { Board, Resource, CardTypeList, ResourceList, MilitaryStats, PlayerData, BuildOptions, ConditionData, PurchaseOptions, Card, StageOptions } from './playerData.model';
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

  /* =================================================
  PURCHASE OPTIONS
  ================================================= */ 

  private checkPurchaseOptions(unmetCostArray: [number, string][][]) : PurchaseOptions[] {
    let buildOptionsArray: BuildOptions[] = [];
    for (let i = 0; i< unmetCostArray.length; i++) {
      buildOptionsArray = this.createPurchaseOptions(unmetCostArray[i]);
    }
    return (buildOptionsArray.length > 0) ? this.filterBuildOptions(buildOptionsArray) : [];
  }

  private filterBuildOptions(buildOptions: BuildOptions[]) {
    let optimalPO: {[key: string]: PurchaseOptions} = {};
    let minCost = -1;
    buildOptions.forEach((options: BuildOptions) => {
      options.purchaseOptions.forEach((PO: PurchaseOptions) => {
        if (minCost === -1 || options.coinCost < minCost) {
          minCost = options.coinCost
          optimalPO = {};
        }
        if (options.coinCost <= minCost) {
          const key = JSON.stringify({
            right: PO.costRight,
            left: PO.costLeft
          })
          if (!optimalPO[key]) {
            optimalPO[key] = PO;
          }
        }
      })
    })
    return Object.values(optimalPO);
  }

  private createPurchaseOptions(resourceCost: Array<any>): BuildOptions[] {
    let buildOptions: BuildOptions[] = []; 
    const right: Player = game.gameData.playerData[this.playerRight],
          left: Player = game.gameData.playerData[this.playerLeft];
    const leftCards: object[] = (!left) ? [] : 
        game.gameData.playerData[this.playerLeft].optionalResources.map(
          (value: [number, string]) => {return { player: 'left', value }})
    const rightCards: object[] = (!right) ? [] :
        game.gameData.playerData[this.playerRight].optionalResources.map(
          (value: [number, string]) => { return { player: 'right', value}})
    const allCards = leftCards.concat(rightCards);
    
    let frontier = this.checkNeighbourResources(resourceCost, left, right);
    frontier.forEach((path: {unmetCost: any[], purchase: PurchaseOptions}) => {
      if (path.unmetCost.length === 0) {
        buildOptions.push({
          costMet: true,
          coinCost: path.purchase.costLeft + path.purchase.costRight,
          purchaseOptions : [path.purchase],
        }) 
      } else {
        buildOptions = buildOptions.concat(this.checkNeighbourAdditionalResources(path, allCards));
      }
    })
    return buildOptions;
  }

  private checkNeighbourResources(resourceCost: any[], left: Player, right: Player) {
    let frontier: {unmetCost: any[], purchase: PurchaseOptions}[] = [];

    for (let i = 0; i < resourceCost.length; i++) {
      const numRequired = resourceCost[i][0],
            resource = resourceCost[i][1].toLowerCase();

      const leftCost = this.purchaseCosts.playerLeft[resource],
            rightCost = this.purchaseCosts.playerRight[resource],
            leftMet = (left) ? left.resources[resource] : 0,
            rightMet = (right) ? right.resources[resource] : 0;

      const rightPurchase = this.createPO("right", numRequired, resource, rightMet, leftMet, rightCost, leftCost),
            leftPurchase = this.createPO("left", numRequired, resource, leftMet, rightMet, leftCost, rightCost);

      const rightTotalCost = rightPurchase.purchase.costLeft + rightPurchase.purchase.costRight,
            leftTotalCost = leftPurchase.purchase.costLeft + leftPurchase.purchase.costRight;

      if ((rightTotalCost > leftTotalCost)) {
          frontier = this.mergePO(frontier, [leftPurchase]);
      } else if (rightTotalCost < leftTotalCost) {
        frontier = this.mergePO(frontier, [rightPurchase]);
      } else if (rightPurchase.purchase.costLeft === leftPurchase.purchase.costLeft) {
        frontier = this.mergePO(frontier, [leftPurchase]);
      } else {
        frontier = this.mergePO(frontier, [rightPurchase, leftPurchase]);
      }
    }
    return frontier;
  }

  private mergePO(frontier: {unmetCost: any[], purchase: PurchaseOptions}[], newPaths: {unmetCost: any[], purchase: PurchaseOptions}[]): {unmetCost: any[], purchase: PurchaseOptions}[] {

    const result: {unmetCost: any[], purchase: PurchaseOptions}[] = [];
    if (frontier.length === 0) return newPaths;
    else {
      frontier.forEach((path: {unmetCost: any[], purchase: PurchaseOptions}) => {
        newPaths.forEach((newPath: {unmetCost: any[], purchase: PurchaseOptions}) => {
          result.push({
            unmetCost: path.unmetCost.concat(newPath.unmetCost),
            purchase: {
              purchaseRight: path.purchase.purchaseRight.concat(newPath.purchase.purchaseRight),
              purchaseLeft: path.purchase.purchaseLeft.concat(newPath.purchase.purchaseLeft),
              costRight: path.purchase.costRight + newPath.purchase.costRight,
              costLeft: path.purchase.costLeft + newPath.purchase.costLeft,
            }
          })
        })
      })
    }
    return result;
  }

  private createPO(a: string, numRequired: number, resource: string, aMet: number, bMet: number, costA: number, costB: number): {unmetCost: any[], purchase: PurchaseOptions} {
    let purchaseA: number = 0;
    let purchaseB: number = 0;

    if (aMet > 0) {
      purchaseA = Math.min(numRequired, aMet);
      numRequired -= aMet;
    }
    if (numRequired > 0 && bMet > 0) {
      purchaseB = Math.min(numRequired, bMet);
      numRequired -= bMet;
    }

    return {
      unmetCost: (numRequired > 0) ? [[numRequired, resource.toUpperCase()]] : [],
      purchase: (a==="right") ? {
          purchaseRight: (purchaseA > 0) ? [[purchaseA, resource]] : [],
          purchaseLeft: (purchaseB > 0) ? [[purchaseB, resource]] : [],
          costRight: purchaseA*costA,
          costLeft: purchaseB*costB,
        } : {
          purchaseRight: (purchaseB > 0) ? [[purchaseB, resource]] : [],
          purchaseLeft: (purchaseA > 0) ? [[purchaseA, resource]] : [],
          costRight: purchaseB*costB,
          costLeft: purchaseA*costA,
        }
      }
  }

  private checkNeighbourAdditionalResources(path: {unmetCost: any[], purchase: PurchaseOptions}, allCards: object[]): BuildOptions[] {
    const result: BuildOptions[] = []
    const resources = path.unmetCost.map((resource: [number, string]) => {
      return resource[1]})
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
    for (let i = 0; i < cards.length; i++) {
      createResourceLists({...initResources}, i, path.purchase, this.purchaseCosts);
    }

    while (resourceLists.length > 0) {
      let cardData = resourceLists.pop();
      const newUnmetCost: any[] = this.checkResources(path.unmetCost, cardData.list)
      if (newUnmetCost.length === 0) {
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
          const newPurchaseOptions: PurchaseOptions = JSON.parse(JSON.stringify(purchaseOptions));
          if (card.player === "right") {
            newPurchaseOptions.purchaseRight.push([value[0], value[1].toLowerCase()]);
            newPurchaseOptions.costRight += purchaseCosts.playerRight[value[1].toLowerCase()];
          } else {
            newPurchaseOptions.purchaseLeft.push([value[0], value[1].toLowerCase()]);
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
    addToFeed(this.username, 'stage', `${this.username} built stage ${stageOptions.stage}`, {stage: stageOptions.stage});
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

  selectCard(cardId: string, coinCost: number, purchaseOptions: PurchaseOptions): ConditionData[] {
    const card: Card = game.cards[cardId];
    this.cardTypes[card.CATEGORY.toLowerCase()].push(cardId);
    this.cards.push(cardId);
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
    let message: string = `${this.username} built ${card.NAME}`;
    if (coinCost > 0) message = message + ` for ${coinCost} coins`
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
    
    let message: string;
    if (values.coins > 0 && values.points > 0) message = `${this.username} earned ${values.coins} coins and ${values.points} points`;
    else if (values.coins > 0) message = `${this.username} earned ${values.coins} coins`;
    else message = `${this.username} earned ${values.points} points`;
    addToFeed(this.username, 'condition', message, {cardId: `${conditionData.cardId}`})
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
