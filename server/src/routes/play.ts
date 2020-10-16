// /game/play route
import { game } from '../models/game.model'
import { Player } from "../models/player.model";
import { validateSelection, handleCardSelect } from "../middleware/gameplay";
const router = require('express').Router(); 
let JWTHandlers = require('../middleware/jwt.authorization');

router.route('/').post((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if (!decodedToken) {
    return res.status(400).json({status: 'Error', message: 'Invalid token'});
  } else if (!(decodedToken.username in game.players)) {
    return res.status(400).json({status: 'Error', message: 'Player not found'});
  } else {
    const username: string = decodedToken.username;
    const {card, action, age, turn, purchase} = req.body;
    const player: Player = game.gameData.playerData[username];
    if (validateSelection(username, card, action)) {
      handleCardSelect(player, username, card, action, age, turn, purchase);
      res.status(200).json({message: `${username} selected card ${card} in Age ${age} Turn ${turn}`})
    } else {
      res.status(400).json({status: 'Error', message: `Invalid Selection: Can't build card # ${card}`})
    }
  }
});

module.exports = router;
