const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[key] = val;
  }
});

const Twilio = require("twilio");

const sid = process.env.TWILIO_SID;
const token = process.env.TWILIO_TOKEN;
const number = process.env.TWILIO_NUMBER;

console.log("Checking Twilio configuration:");
console.log("SID:", sid ? sid.slice(0, 8) + "..." : "MISSING");
console.log("Token:", token ? token.slice(0, 4) + "..." : "MISSING");
console.log("Number:", number);

if (sid && token) {
  const client = Twilio(sid, token);
  client.api.v2010.accounts(sid).fetch()
    .then(account => {
      console.log("Twilio Account Verified:", account.friendlyName, "Status:", account.status);
    })
    .catch(err => {
      console.error("Twilio Account Verification Failed:", err.message);
    });
}
