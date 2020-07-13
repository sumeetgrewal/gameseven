export const boardImages = importAll(require.context('../assets/images/boards', false, /\.jpg|png$/));
export const cardImages = importAll(require.context('../assets/images/cards', false, /\.jpg|png$/));

function importAll(r: any) {
  let images: any = {};
  r.keys().forEach((item: any, index: any) => { images[item.replace('./', '')] = r(item); });
  return images;
}

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

export type Resource = "wood" | "ore" | "stone" | "clay" | "glass" | "papyrus" | "loom" | "compass" | "tablet" | "gear"

export interface ResourceList {
  [index: string] : number,
  wood: number,
  ore: number,
  stone: number,
  clay: number,
  glass: number,
  papyrus: number,
  loom: number,
  compass: number,
  tablet: number,
  gear: number,
}

export interface CardTypeList {
  [index: string] : Array<string>,
  brown: Array<string>,
  gray: Array<string>,
  blue: Array<string>,
  green: Array<string>,
  red: Array<string>,
  yellow: Array<string>,
  purple: Array<string>,
}

export interface MilitaryStats {
  loss: number,
  one: number,
  three: number,
  five: number
}

export interface PlayerData {
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