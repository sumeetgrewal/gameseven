const AWS = require("aws-sdk");

AWS.config.update({region: 'us-west-2'});
let ddb = new AWS.DynamoDB();

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

function tableScan(tableName: string): Promise<any> {
    return new Promise((resolve) => {
        let params = {
            TableName: tableName
        };
        ddb.scan(params, function(err: Error, data: any) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success: Retrieved " + data.Items.length + " entries from " + tableName);
                resolve(data.Items);
            }
        });
    })
}

exports.tableScan = tableScan;