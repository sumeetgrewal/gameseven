const compression = require('compression');
const morgan = require('morgan');
import express from 'express';
const dbScan = require('./dbScan')

const app = express();
const port = process.env.PORT || '8000';

app.use(compression({ filter: shouldCompress }))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

function shouldCompress (req: any, res: any) {
  if (req.headers['x-no-compression']) {
    return false
  }
  return compression.filter(req, res)
}

const gameRouter = require('./routes/game');
app.use('/game', gameRouter);

app.listen(port, err => {
  if (err) return console.error(err);
  return console.log(`Server is listening on ${port}`);
});