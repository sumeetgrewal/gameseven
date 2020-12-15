import { Player } from "./player.model";

export interface Board {
  BOARD_ID: number;
  NAME: string;
  SHORT_NAME: string;
  SIDE: string; // ["A", "B"]
  RESOURCE: string; // RESOURCE
  S1_COST?: Array<any>; // [Q, RESOURCE]
  S2_COST?: Array<any>;
  S3_COST?: Array<any>;
  S1_VALUE?: Array<any>;
  S2_VALUE?: Array<any>;
  S3_VALUE?: Array<any>;
  PLAYER?: string;
}

export interface Card {
  CARD_ID: number;
  AGE: number;
  NAME: string;
  CATEGORY: string; // ["BROWN", "GRAY", "BLUE", "GREEN", "RED", "YELLOW", "PURPLE"]
  VALUE?: Array<any>;
  VALUE_TYPE: string; // ["AND", "OR", "DISCOUNT", "CONDITION"]
  RESOURCE_COST?: Array<any>; // [Q, RESOURCE]
  CHAIN_COST?: Array<number>; // [CARD_ID]
  CHAINS?: Array<any>;
  NUM_PLAYERS: number;
}

export interface PlayerData {
  board: Board | undefined;
  cards: Array<string>;
  cardTypes: CardTypeList;
  resources: ResourceList;
  optionalResources?: Array<any>;
  personalResources?: Array<any>;
  military: MilitaryStats;
  stagesBuilt: number;
  coins: number;
  shields: number;
  points?: number;
  stagePoints: number;
  civilianPoints: number;
  commercialPoints: number;
  guildPoints: number;
}
export type Resource = "wood" | "ore" | "stone" | "clay" | "glass" | "papyrus" | "loom" | "compass" | "tablet" | "gear";

export interface BuildOptions {    
  costMet: boolean,
  coinCost: number,
  purchaseOptions: PurchaseOptions[],
}

export interface ConditionData  {
  cardId: number,
  category: any[],
  player: any[],
  value: any[],
}

export interface PurchaseOptions {
  purchaseRight: any[],
  purchaseLeft: any[],
  costRight: number,
  costLeft: number
}

export interface StageOptions {
  stage: number, 
  cost: any, 
  value: any,
  options: BuildOptions
}

export class ResourceList {
  [index: string]: number;
  wood: number;
  ore: number;
  stone: number;
  clay: number;
  glass: number;
  papyrus: number;
  loom: number;
  compass: number;
  tablet: number;
  gear: number;
  constructor(initValue: number = 0) {
    this.wood = initValue;
    this.ore = initValue;
    this.stone = initValue;
    this.clay = initValue;
    this.glass = initValue;
    this.papyrus = initValue;
    this.loom = initValue;
    this.compass = initValue;
    this.tablet = initValue;
    this.gear = initValue;
  }
}

export class CardTypeList {
  [index: string]: Array<string>;
  brown: Array<string>;
  gray: Array<string>;
  blue: Array<string>;
  green: Array<string>;
  red: Array<string>;
  yellow: Array<string>;
  purple: Array<string>;
  constructor() {
      this.brown = [];
      this.gray = [];
      this.blue = [];
      this.green = [];
      this.red = [];
      this.yellow = [];
      this.purple = [];
  }
}

export interface MilitaryStats {
  loss: number;
  one: number;
  three: number;
  five: number;
}

export interface gameModel {
  [index: string]: any;
  metadata: {
    gameStatus: string;
    playerOrder: string[];
    age: number;
    turn: number;
  };
  players: {
    [index: string]: {
      status?: string,
      board?: any,
      boardID?: string,
      handID?: number,
      handInfo?: {[id: string] : BuildOptions},
      stageInfo?: StageOptions,
    };
  };
  cards: {
    [index: string]: Card;
  };
  boards: {
    [index: string]: Board;
  };
  setupData?: {
    boards: string[];
    assignedBoards: string[]; 
    turnToChoose: number; 
  };
  selections: {
    [age: number]: any;
  };
  gameData?: {
    playerData: {
      [username: string]: Player;
    };
    discardPile: string[],
  };
  gameFeed: feedItem[]
}


export type feedItem = {
  playerName: string;
  age: number;
  turn: number;
  action: string; // build / discard / stage / condition / payment / military
  message: string;
  additionalParams: {
    cardId?: string;
    opponent?: string;
    stage?: number;
  };
};

export class GameScore {
  [index: string]: number;
  military: number;
  coins: number;
  stages: number;
  civilian: number;
  commercial: number;
  guilds: number;
  scientific: number;
  total: number;
  constructor() {
    this.military = 0;
    this.coins = 0;
    this.stages = 0;
    this.civilian = 0;
    this.commercial = 0;
    this.guilds = 0;
    this.scientific = 0;
    this.total = 0;
  }
}