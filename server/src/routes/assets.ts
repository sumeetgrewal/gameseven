import { game } from '../models/game.model';
let JWTHandlers = require('../middleware/jwt.authorization');
const router = require('express').Router(); 

router.route('/').get((req: any, res: any) => {
  const decodedToken: any = JWTHandlers.checkToken(req);
  if (!decodedToken) {
    res.status(400).json({ status: 'Error', message: 'Invalid token' });
  } else if (!(decodedToken.username in game.players)) {
    res.status(400).json({ status: 'Error', message: 'Player not found' });
  } else {
    res.status(200).json({ boards: game.boards, cards: game.cards });
  }
});

module.exports = router;
