export const boardImages = importAll(require.context('../assets/images/boards', false, /\.jpg|png$/));
export const cardImages = importAll(require.context('../assets/images/cards', false, /\.jpg|png$/));
export const iconImages = importAll(require.context('../assets/images/icons', false, /\.jpg|png$/));

function importAll(r: any) {
  let images: any = {};
  r.keys().forEach((item: any, index: any) => { images[item.replace('./', '')] = r(item); });
  return images;
}

export type Resource = "wood" | "ore" | "stone" | "clay" | "glass" | "papyrus" | "loom" | "compass" | "tablet" | "gear"

export interface Board {
  BOARD_ID: number,  // Partition key
  NAME: string,
  SHORT_NAME: string,
  SIDE: string, // ["A", "B"]
  RESOURCE: string, // ["WOOD", "ORE", "STONE", "CLAY", "GLASS", "LOOM", "PAPYRUS", "COMPASS"]
  S1_COST?: Array<any>, // [Q,["WOOD", "ORE", "STONE", "CLAY", "GLASS", "LOOM", "PAPYRUS", "COMPASS", "TABLET", "GEAR", "POINT", "SHIELD", "COIN"]]
  S2_COST?: Array<any>,
  S3_COST?: Array<any>,
  S1_VALUE?: Array<any>,
  S2_VALUE?: Array<any>,
  S3_VALUE?: Array<any>,
  PLAYER?: string,
}

export interface Card {
  CARD_ID: number, // partition key
  AGE: number, // [1, 2, 3]
  NAME: string,
  CATEGORY: string, // ["BROWN", "GRAY", "BLUE", "GREEN", "RED", "YELLOW", "PURPLE"]
  VALUE?: Array<any>,
  VALUE_TYPE: string, // ["AND", "OR", "DISCOUNT", "CONDITION"]
  RESOURCE_COST?: Array<any>, // [Q,["WOOD", "ORE", "STONE", "CLAY", "GLASS", "LOOM", "PAPYRUS", "COMPASS", "TABLET", "GEAR", "POINT", "SHIELD", "COIN"]]
  CHAIN_COST?: Array<number>, // card_id
  CHAINS?: Array<any>,
  NUM_PLAYERS: number,
}

export interface BuildOptions {    
  costMet: boolean,
  coinCost: number,
  purchaseOptions: PurchaseOptions[],
}

export interface PurchaseOptions {
  purchaseRight: [],
  purchaseLeft: [],
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
  loss: number,
  one: number,
  three: number,
  five: number
}

export interface PlayerData {
  username: string,
  board: Board | undefined,
  cards: Array<string>,
  cardTypes: CardTypeList,
  resources: ResourceList,
  optionalResources?: Array<any>,
  personalResources?: Array<any>,
  military: MilitaryStats,
  stagesBuilt: number;
  coins: number,
  shields: number,
  points?: number,
  stageData?: {[id: number] : {cost: any, value: any}};
  playerLeft?: string;
  playerRight?: string;
}
