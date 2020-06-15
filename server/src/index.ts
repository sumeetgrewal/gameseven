import express from 'express';

const app = express();
const port = process.env.PORT || '8000';
const AWS = require("aws-sdk");

// Print credentials to confirm they are correctly configured
// The location of the shared credentials file 
//    on Linux, Unix, and macOS: ~/.aws/credentials
//    on Windows: C:\Users\USER_NAME\.aws\credentials
AWS.config.getCredentials(function(err: any) {
  if (err) console.log(err.stack);
  else {
    console.log("Access key:", AWS.config.credentials.accessKeyId
    );
  }
});
AWS.config.update({region: 'us-west-2'});

var ddb = new AWS.DynamoDB();
var params = {
  ProjectionExpression: 'CARD_ID',
  TableName: 'CARDS'
};

ddb.scan(params, function(err: Error, data: any) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.Items);
    // data.Items.forEach(function(element: any, index: any, array: any) {
    //   console.log(element.Name.s);
    // });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.listen(port, err => {
  if (err) return console.error(err);
  return console.log(`Server is listening on ${port}`);
});