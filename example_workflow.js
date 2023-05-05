const crypto = require('crypto');
const { Octokit } = require("@octokit/core");
const sodium = require('libsodium-wrappers');

const octokit = new Octokit({ auth: process.env.GHE_PAT });

const secret = process.env.TEAM_TOKEN
  
encryptUpdateRepoSecret()
      .then(res => {
        console.log({ res })
        process.exitCode = 0
      })
      .catch(err => {
        console.log({ err })
        process.exitCode = 1
      })
 
async function encryptUpdateRepoSecret() {
  
  const publicKeyResponse = await octokit.request('GET /repos/TMelchiorE/testing-actions/actions/secrets/public-key', {
    owner: 'TMelchiorE',
    repo: 'testing-actions',
    })

  const publicKey = publicKeyResponse.data.key;
  const publicKeyId = publicKeyResponse.data.key_id;

  console.log("--repo pubkey=" + publicKey)

  // Convert Secret & Base64 key to Uint8Array.
  let binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL)
  let binsec = sodium.from_string(secret)
  
  //Encrypt the secret using LibSodium
  let encBytes = sodium.crypto_box_seal(binsec, binkey)
  
  // Convert encrypted Uint8Array to Base64
  let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
  
  console.log("--encrpyted secret=" + output)

  const updateSecretResponse = await octokit.request('PUT /repos/TMelchiorE/testing-actions/actions/secrets/TEAM_TOKEN', {
    owner: 'TMelchiorE',
    repo: 'testing-actions',
    secret_name: 'TEAM_TOKEN',
    key_id: publicKeyId,
    encrypted_value: output,
  });

  console.log (updateSecretResponse)

};
