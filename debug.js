const fname = "./REPLAYS/UnsavedReplay-2024.01.23-22.17.24.replay";

const fs = require('fs');
const parseReplay = require('fortnite-replay-parser');
const replayBuffer = fs.readFileSync(fname);

const handleEventEmitter = require('./FortniteReplayParser/Exports/handleEventEmitter');
const NetFieldExports    = require('./FortniteReplayParser/NetFieldExports');
const customClasses      = require('./FortniteReplayParser/Classes');

const config = {
  parseLevel: 1,
  debug: true,
  parsePackets: true,
  parseEvents: true,
}

const custom_config = {
  parseLevel: 1,
  debug: true,
  handleEventEmitter,
  customNetFieldExports: NetFieldExports,
  onlyUseCustomNetFieldExports: true,
  customClasses,
}

parseReplay(replayBuffer, custom_config).then((parsedReplay) => {
  fs.writeFileSync('./DEBUG/replayData.json', JSON.stringify(parsedReplay));
}).catch((err) => {
  console.error('An error occured while parsing the replay!', err);
});