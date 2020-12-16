import { game } from './game.model'
import { Player } from './player.model';
import { Resource, ResourceList, BuildOptions, PurchaseOptions } from './playerData.model';

export class Validator {
  player: Player;

  canBuild(cardID: string, player: Player): BuildOptions {
    this.player = player;
    const card = game.cards[cardID];
    // Is card free or is chain cost met ?
    if ((card.RESOURCE_COST.length === 0) || (this.isChainCostMet(card.CHAIN_COST, this.player.cards))) {
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

  canStage(player: Player): BuildOptions {
    this.player = player;
    let nextStage: {
      cost: any,
      value: any
    };
    if (this.player.stageData) {
      nextStage = this.player.stageData[this.player.stagesBuilt + 1];
    }
    if (this.player.stagesBuilt === 3) {
      return {
        costMet: false,
        coinCost: 0,
        purchaseOptions: []
      }
    }
    return this.checkCost(nextStage.cost);
  }

  private checkCost(resourceCost: any): BuildOptions {
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
        const bestPurchaseOptions: PurchaseOptions[] = this.checkPurchaseOptions(unmetCostArray);
        if (bestPurchaseOptions.length > 0) {
          buildOptions.costMet = true;
          buildOptions.coinCost = bestPurchaseOptions[0].costLeft + bestPurchaseOptions[0].costRight;
          buildOptions.purchaseOptions = bestPurchaseOptions;
        }
      }
    }
    // Can I afford the cost? 
    if (buildOptions.coinCost > this.player.coins) {
      buildOptions.costMet = false;
    }
    return buildOptions;
  }

  private isChainCostMet(chainCost: Array < any >, cards: string[]): boolean {
    for (let i = 0; i < chainCost.length; i++) {
      const cardID: any = chainCost[i];
      if (cards.includes(cardID)) {
        return true;
      }
    }
    return false;
  }

  private getCoinCost(resourceCost: Array < any > ): number {
    let coinCost = 0;
    resourceCost.forEach((resource: [number, string]) => {
      if (resource[1] === 'COIN') {
        coinCost = resource[0];
      }
    })
    return coinCost;
  }

  private isResourceCostMet(resourceCost: Array < any > ): Array < any > {
    let unmetCost: any[] = this.checkResources(resourceCost);
    if (unmetCost.length > 0) {
      unmetCost = this.checkAdditionalResources(unmetCost, this.player.optionalResources.concat(this.player.personalResources));
    }
    return unmetCost;
  }

  private checkResources(resourceCost: Array < any > , values: ResourceList = this.player.resources): Array < any > {
    const unmetCost: any[] = [];

    resourceCost.forEach((resource: [number, Resource]) => {
      let numRequired = resource[0];
      numRequired -= values[resource[1].toLowerCase()];
      if (numRequired > 0) {
        unmetCost.push([numRequired, resource[1]]);
      }
    })

    return unmetCost;
  }

  private checkAdditionalResources(resourceCost: Array < any > , allCards: any[]): [number, string][][] {
    const unmetCostArray: any[] = [];
    const resources = resourceCost.map((resource: [number, string]) => {
      return resource[1]
    })
    const cards: any[] = [];
    allCards.forEach((valueArray: Array < [number, string] > ) => {
      const newValues = valueArray.filter((resourceValue: [number, string]) => {
        if (resources.includes(resourceValue[1])) return resourceValue;
      })
      if (newValues.length > 0) cards.push(newValues);
    });

    if (cards.length === 0) return [resourceCost];
    let resourceLists: Array < [ResourceList, number] > = [];
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
      const card: Array < [number, string] > = cards[cardIndex];
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

  private checkPurchaseOptions(unmetCostArray: [number, string][][]): PurchaseOptions[] {
    let buildOptionsArray: BuildOptions[] = [];
    for (let i = 0; i < unmetCostArray.length; i++) {
      buildOptionsArray = this.createPurchaseOptions(unmetCostArray[i]);
    }
    return (buildOptionsArray.length > 0) ? this.filterBuildOptions(buildOptionsArray) : [];
  }

  private filterBuildOptions(buildOptions: BuildOptions[]) {
    let optimalPO: {
      [key: string]: PurchaseOptions
    } = {};
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

  private createPurchaseOptions(resourceCost: Array < any > ): BuildOptions[] {
    const { playerLeft, playerRight } = this.player;
    let buildOptions: BuildOptions[] = [];
    const right: Player = game.gameData.playerData[playerRight],
      left: Player = game.gameData.playerData[playerLeft];
    const leftCards: object[] = (!left) ? [] :
      game.gameData.playerData[playerLeft].optionalResources.map(
        (value: [number, string]) => {
          return {
            player: 'left',
            value
          }
        })
    const rightCards: object[] = (!right) ? [] :
      game.gameData.playerData[playerRight].optionalResources.map(
        (value: [number, string]) => {
          return {
            player: 'right',
            value
          }
        })
    const allCards = leftCards.concat(rightCards);

    let frontier = this.checkNeighbourResources(resourceCost, left, right);
    frontier.forEach((path: {
      unmetCost: any[],
      purchase: PurchaseOptions
    }) => {
      if (path.unmetCost.length === 0) {
        buildOptions.push({
          costMet: true,
          coinCost: path.purchase.costLeft + path.purchase.costRight,
          purchaseOptions: [path.purchase],
        })
      } else {
        buildOptions = buildOptions.concat(this.checkNeighbourAdditionalResources(path, allCards));
      }
    })
    return buildOptions;
  }

  private checkNeighbourResources(resourceCost: any[], left: Player, right: Player) {
    const { purchaseCosts } = this.player;
    let frontier: {
      unmetCost: any[],
      purchase: PurchaseOptions
    } [] = [];

    for (let i = 0; i < resourceCost.length; i++) {
      const numRequired = resourceCost[i][0],
        resource = resourceCost[i][1].toLowerCase();

      const leftCost = purchaseCosts.playerLeft[resource],
        rightCost = purchaseCosts.playerRight[resource],
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

  private mergePO(frontier: { unmetCost: any[], purchase: PurchaseOptions } [], newPaths: { unmetCost: any[], purchase: PurchaseOptions } []): {unmetCost: any[], purchase: PurchaseOptions} [] {
    const result: { unmetCost: any[], purchase: PurchaseOptions } [] = [];

    if (frontier.length === 0) return newPaths;
    else {
      frontier.forEach((path: { unmetCost: any[], purchase: PurchaseOptions }) => {
        newPaths.forEach((newPath: { unmetCost: any[], purchase: PurchaseOptions}) => {
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

  private createPO(a: string, numRequired: number, resource: string, aMet: number, bMet: number, costA: number, costB: number): {unmetCost: any[],purchase: PurchaseOptions} {
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
      unmetCost: (numRequired > 0) ? [
        [numRequired, resource.toUpperCase()]
      ] : [],
      purchase: (a === "right") ? {
        purchaseRight: (purchaseA > 0) ? [
          [purchaseA, resource]
        ] : [],
        purchaseLeft: (purchaseB > 0) ? [
          [purchaseB, resource]
        ] : [],
        costRight: purchaseA * costA,
        costLeft: purchaseB * costB,
      } : {
        purchaseRight: (purchaseB > 0) ? [
          [purchaseB, resource]
        ] : [],
        purchaseLeft: (purchaseA > 0) ? [
          [purchaseA, resource]
        ] : [],
        costRight: purchaseB * costB,
        costLeft: purchaseA * costA,
      }
    }
  }

  private checkNeighbourAdditionalResources(path: { unmetCost: any[], purchase: PurchaseOptions}, allCards: object[]): BuildOptions[] {
    const result: BuildOptions[] = [];
    const resources = path.unmetCost.map((resource: [number, string]) => { return resource[1] })
    const cards: any[] = [];
    allCards.forEach((card: { player: string, value: Array < [number, string] > }) => {
      const newValues = card.value.filter((resourceValue: [number, string]) => {
        if (resources.includes(resourceValue[1])) return resourceValue;
      })
      if (newValues.length > 0) cards.push({ ...card, value: newValues })
    })
    if (cards.length === 0) return []
    
    let resourceLists: Array < { list: ResourceList, cardIndex: number, purchaseOptions: PurchaseOptions } > = [];
    let initResources: ResourceList = new ResourceList(0);
    for (let i = 0; i < cards.length; i++) {
      createResourceLists({ ...initResources}, i, path.purchase, this.player.purchaseCosts);
    }

    while (resourceLists.length > 0) {
      let cardData = resourceLists.pop();
      const newUnmetCost: any[] = this.checkResources(path.unmetCost, cardData.list)
      if (newUnmetCost.length === 0) {
        const { purchaseOptions } = cardData;
        const buildOption: BuildOptions = {
          costMet: true,
          coinCost: purchaseOptions.costLeft + purchaseOptions.costRight,
          purchaseOptions: [purchaseOptions],
        }
        result.push(buildOption);
      } else {
        createResourceLists(cardData.list, cardData.cardIndex + 1, cardData.purchaseOptions, this.player.purchaseCosts);
      }
    }
    return result;

    function createResourceLists(list: ResourceList, cardIndex: number, purchaseOptions: PurchaseOptions, purchaseCosts: { playerLeft: ResourceList, playerRight: ResourceList }): void {
      const card: { player: 'right' | 'left', value: Array < [number, string] > } = cards[cardIndex];
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
            purchaseOptions: newPurchaseOptions
          });
        });
      }
    }
  }
}
