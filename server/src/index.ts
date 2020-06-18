import express from 'express';

const app = express();
const port = process.env.PORT || '8000';

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const gameRouter = require('./routes/game');
app.use('/game', gameRouter);

app.listen(port, err => {
  if (err) return console.error(err);
  return console.log(`Server is listening on ${port}`);
});