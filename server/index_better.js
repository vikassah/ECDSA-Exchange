const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { hexToBytes, concatBytes, toHex, utf8ToBytes } = require("ethereum-cryptography/utils");

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {};
const pubPvtMapping = {};


/**
 * Summary: Initializes wallets.
 * 
 * Description: Initializes wallets and saves public keys/private keys.
 * 
 * @param {int} num number of wallets to be initialized.
 */
function initializeWallets(num=3) {

  for(let i=0; i<num; i++) {
    //generate key pair
    let key = ec.genKeyPair(); 
    //let shortPubKey = shortenPubKey(key.getPublic().encode('hex'));

    // store public key to balance mapping
    balances[key.getPublic().encode('hex')] = (i+1) * 50;

    // store public, private key mapping
    pubPvtMapping[key.getPrivate().toString("hex")] = key.getPublic().encode('hex');
  }

  //print available accounts
  let i=0;
  console.log("Available Accounts");
  console.log("====================")
  for(let key in balances){
    i+=1;
    console.log(`(${i}) ${key} (${balances[key]})`);
  }

  //print private keys
  i=0;
  console.log("");
  console.log("Private Keys");
  console.log("=====================");
  for(let key in pubPvtMapping){
    i+=1;
    console.log(`(${i}) ${key}`);
  }
}

//call initialize wallets
initializeWallets();

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {amount, recipient, sender, signature} = req.body;
  /** console.log("Signature: " + signature);
  console.log("Recipient: " + recipient);
  console.log("amount: " + amount);
  console.log("sender: " + sender); */

  const messageHash = SHA256(JSON.stringify({
    to:recipient,
    amount:amount
  })).toString();

  //const recoveredPublicKey = ec.recoverPubKey(messageHash, signature, 0);
  
  const senderKey = ec.keyFromPublic(sender, 'hex');

  //console.log("recovered pub key: " + senderKey.getPublic().encode('hex'));

  // validate if the sender public key is able to verify the message and it exists in the exchange
  if(senderKey.verify(messageHash, signature) && balances[sender] && balances[recipient]) {
    balances[sender] -= parseInt(amount);
    balances[recipient] = (balances[recipient] || 0) + +amount;
  }

  printBalances();

  res.send({ balance: balances[recipient] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});


// print balances on all accounts on the exchange
function printBalances() {
  //print available accounts
  let i=0;
  console.log("Updated Balances");
  console.log("====================")
  for(let key in balances){
    i+=1;
    console.log(`(${i}) ${key} (${balances[key]})`);
  }
}


/**
 * Summary: shorten public key.
 * 
 * Description: shorten public key to last 40 hexadecimal chars.
 * 
 * @param {hex} fullPubKey full public key in hex.
 */
 function shortenPubKey(fullPubKey) {
  let hashKey = SHA256(fullPubKey);
  console.log(hashKey);
}