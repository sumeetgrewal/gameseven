import { game } from '../models/game.model';
import { Player } from "../models/player.model";
import { addToFeed } from "./gameFeed";

// --------------------
// MILITARY 
// --------------------

export function handleMilitary() {
  const allPlayerData = game.gameData.playerData;
  const players = Object.entries(allPlayerData);
  if (players.length >= 3) {
    players.forEach((player: [string, Player]) => {
      const leftBattle = militaryConflict(player[1], allPlayerData[player[1].playerLeft]);
      game.gameData.playerData[player[1].playerLeft] = leftBattle[0];
      game.gameData.playerData[player[0]] = leftBattle[1];
    });
  }

  function militaryConflict(self: Player, opp: Player): [Player, Player] {
    if (opp.shields > self.shields) {
      self.military.loss += 1;
      opp = winConflict(opp);
      addToFeed(opp.username, 'military', `${opp.username} defeated ${self.username}`, { "opponent": self.username });
    } else if (opp.shields < self.shields) {
      opp.military.loss += 1;
      self = winConflict(self);
      addToFeed(self.username, 'military', `${self.username} defeated ${opp.username}`, { "opponent": opp.username });
    }
    return [opp, self];
  }
}

function winConflict(player: Player): Player {
  switch (game.metadata.age) {
    case 1:
      player.military.one += 1;
      break;
    case 2:
      player.military.three += 1;
      break;
    case 3:
      player.military.five += 1;
      break;
    default:
      break;
  }
  return player;
}
