import { pushUpdateToPlayers } from "./util";
import { game, serverData } from '../models/game.model';

// --------------------
// GAME FEED
// --------------------

let gameFeed: feedItem[] = [];

type feedItem = {
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

export function addToFeed(playerName: string, action: string, message: string, additionalParams: {cardId?: string;
    opponent?: string; stage?: number} = {}, age: number = game.metadata.age, turn: number = game.metadata.turn) {
  let item: feedItem = {
    age,
    turn,
    playerName,
    action,
    message,
    additionalParams,
  };
  gameFeed.push(item);
}

export function sendFeedUpdate() {
  pushUpdateToPlayers(JSON.stringify({ gameFeed }), 'feedUpdate', serverData.clients);
  gameFeed = [];
}
