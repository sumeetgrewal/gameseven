import { Board, Resource, CardTypeList, ResourceList, MilitaryStats, PlayerData } from './playerData.model';

export class Player implements PlayerData {
  board: Board | undefined;
  cards: Array<string>;
  cardTypes: CardTypeList;
  resources: ResourceList;
  coins: number;
  shields: number;
  points?: number;
  optionalResources?: Array<[number, Resource]>;
  personalResources?: Array<[number, Resource]>;
  military: MilitaryStats;

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
    this.military = {
        loss: 0,
        one: 0,
        three: 0,
        five: 0,
    }
  }


  selectCard(card: string) {
      // TODO validation
      this.cards.push(card);
      console.log("Will handle validation ");
      // TODO Add to cardTypes as well
  }
}