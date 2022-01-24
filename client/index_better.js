import "./index.scss";
const secp = require("@noble/secp256k1");
const SHA256 = require('crypto-js/sha256');

const server = "http://localhost:3042";

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const privateKey = document.getElementById("private-key").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  const messageHash = SHA256(JSON.stringify({
    to:recipient,
    amount:amount
  })).toString();

  (async () => {
    // use secp.sign() to produce signature and recovery bit (response is an array of two elements)
    const signatureArray = await secp.sign(messageHash, privateKey, {
      recovered: true
    });
    // separate out returned array into the string signature and the number recoveryBit
    const signature = signatureArray[0].toString();
    const recoveryBit = signatureArray[1];

    console.log("Sign: " + signature);
    console.log("Recovery: " + recoveryBit);
    
    const body = JSON.stringify({
      amount, recipient, signature, recoveryBit
    });

    const request = new Request(`${server}/send`, { method: 'POST', body });

    fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
      return response.json();
    }).then(({ balance }) => {
      document.getElementById("balance").innerHTML = balance;
    });
  })();
});

