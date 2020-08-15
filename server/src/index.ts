import express from 'express';
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const app = express();
const port = process.env.PORT || '8000';

// Serve frontend when in production
app.use(express.static(path.join(__dirname, '/../client/build')));

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

const gameSetupRouter = require('./routes/setup');
const gamePlayRouter = require('./routes/play');

app.use('/game', gameSetupRouter);
app.use('/game/play', gamePlayRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/../client/build', 'index.html'));
});

app.listen(port, err => {
  if (err) return console.error(err);
  return console.log(`Server is listening on ${port}`);
});