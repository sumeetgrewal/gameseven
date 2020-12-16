import { game } from '../models/game.model';
const AWS = require("aws-sdk");

AWS.config.update({region: 'us-west-2'});
let ddb = new AWS.DynamoDB();

export function prepareGameAssets(playerCount: number): Promise<void> {
  return new Promise((resolve) => {
    const numPlayers: string = (playerCount <= 3) ? '3' : playerCount.toString();
    const cardFilter = {
      FilterExpression: "#np <= :np",
      ExpressionAttributeNames: { "#np": "NUM_PLAYERS" },
      ExpressionAttributeValues: { ":np": { N: numPlayers } }
    };
    console.time("Load Data")
    const boards = Promise.resolve(loadTable('BOARDS', 'BOARD_ID'));
    const cards = Promise.resolve(loadTable('CARDS', 'CARD_ID', cardFilter));
    console.timeEnd("Load Data")
    Promise.all([boards, cards]).then(() => {
      resolve();
    });
  });
}


function loadTable(tableName: string, id: string, params: {} = {}): Promise<void> {
    const tableData = Promise.resolve(tableScan(tableName, id, params));
    return Promise.resolve(tableData).then((response) => {
      game[tableName.toLowerCase()] = response;
    });
}

// Print credentials to confirm they are correctly configured
// The location of the shared credentials file 
//    on Linux, Unix, and macOS: ~/.aws/credentials
//    on Windows: C:\Users\USER_NAME\.aws\credentials
// AWS.config.getCredentials(function(err: any) {
//     if (err) console.log(err.stack);
//     else {
//       console.log("Access key:", AWS.config.credentials.accessKeyId
//       );
//     }
//   });

function tableScan(tableName: string, tableID: string, addParams: {}): Promise<any> {
    return new Promise((resolve) => {
        let params: any = {
            ...addParams,
            TableName: tableName,
        }
        ddb.scan(params, function(err: Error, data: any) {
            if (err) console.log("Error", err)
            else {
                console.log("Success: Retrieved " + data.Count + " entries from " + tableName);
                let convertedData: any = {};
                data.Items.forEach((record: object) => {
                    const newRecord = AWS.DynamoDB.Converter.unmarshall(record)
                    convertedData[newRecord[tableID]] = newRecord;
                });
                resolve(convertedData);
            }
        });
    })
}
