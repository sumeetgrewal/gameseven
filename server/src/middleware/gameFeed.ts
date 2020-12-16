import { game, serverData, pushUpdateToPlayers } from '../models/game.model';
import { feedItem } from "../models/playerData.model";

// --------------------
// GAME FEED
// --------------------

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
  game.gameFeed.push(item);
}

export function sendFeedUpdate() {
  pushUpdateToPlayers(JSON.stringify({ gameFeed: game.gameFeed }), 'feedUpdate', serverData.clients);
  game.gameFeed = [];
}
