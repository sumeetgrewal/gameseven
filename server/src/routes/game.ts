const router = require('express').Router();
let game = require('../models/game.model');
let clients: any = [];

router.route('/player').get((req: any, res: any) => {
  const username = req.body.username
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);
  res.write(JSON.stringify(game.players) + '\n\n');

  const newClient = {
    id: username,
    res
  }
  clients.push(newClient);

  req.on('close', () => {
    console.log(req.body.username + ' Connection closed');
    clients = clients.filter( (client: any) => client.id !== username);
  });
});

router.route('/player/').post((req: any, res: any) => {
  console.log(req.body);
  if (req.body.password !== 'password') throw new Error();
  else if (req.body.username in game.players) throw new Error('Username taken')
  else if (game.players.length === 7) throw new Error('Game full')
  else {
    const username = req.body.username
    game.players[username] = {status: 'not ready', board: null};

    clients.forEach( (client: any) => client.res.write(JSON.stringify(game.players) + '\n\n') );

    res.json('success');
  }
});

router.route('/player').put((req: any, res: any) => {
  // TODO: need to authenticate player again or else anyone can hit this endpoint
  if (!(req.body.username in game.players)) res.status(400).json('Player not found')
  else {
    const username = req.body.username;
    let status: string;
    let board: any;

    if (req.body.status) status = req.body.status;
    if (req.body.board) board = req.body.board;

    if (status) {
      game.players[username].status = status;
    }

    if (board) {
      game.players[username].board = board;
    }

    clients.forEach( (client: any) => client.res.write(JSON.stringify(game.players) + '\n\n') ); 

    res.json('success');
  }
});

module.exports = router;