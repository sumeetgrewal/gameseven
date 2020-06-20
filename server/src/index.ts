import express from 'express';
const dbScan = require('./dbScan')

const app = express();
const port = process.env.PORT || '8000';

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.get('/load', (req, res) => {
  dbScan.tableScan('CARDS');
  dbScan.tableScan('BOARDS');
  res.send('Loaded Tables');
})

app.listen(port, err => {
  if (err) return console.error(err);
  return console.log(`Server is listening on ${port}`);
});