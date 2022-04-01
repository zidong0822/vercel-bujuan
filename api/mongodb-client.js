// Import the dependency.
const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://bujuan:bujuan123@cluster0.bsqqk.mongodb.net/bujuan?retryWrites=true&w=majority';
const options = {
   useUnifiedTopology: true,
   useNewUrlParser: true,
};
let client;
let clientPromise;
client = new MongoClient(uri, options);
clientPromise = client.connect()
  // Export a module-scoped MongoClient promise. By doing this in a
  // separate module, the client can be shared across functions.
module.exports = clientPromise;