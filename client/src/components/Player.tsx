import { Board, Resource, CardTypeList, ResourceList, MilitaryStats } from './GameAssets';

interface PlayerData {
    board: Board | undefined,
    cards: Array<string>,
    cardTypes: CardTypeList,
    resources: ResourceList,
    optionalResources?: Array<[number, Resource]>,
    personalResources?: Array<[number, Resource]>,
    military?: MilitaryStats,
    coins: number,
    shields: number,
    points?: number,
  }
  

  // TODO game should just use as interface
export class Player implements PlayerData {
    board: Board | undefined = undefined;
    cards: Array<string> = [];
    cardTypes: CardTypeList = {
      brown: [],
      gray: [],
      blue: [],
      green: [],
      red: [],
      yellow: [],
      purple: [],
    };
    resources: ResourceList = {
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
    coins: number = 3;
    shields: number = 0;
    
    points?: number = 0;
    optionalResources?: Array<[number, Resource]> = [];
    personalResources?: Array<[number, Resource]> = [];
    military?: MilitaryStats = {
        loss: 0,
        one: 0,
        three: 0,
        five: 0,
    }

    selectCard(card: string) {
        // TODO validation
        this.cards.push(card);
        console.log("Will handle validation ");
        // TODO Add to cardTypes as well
    }
  }