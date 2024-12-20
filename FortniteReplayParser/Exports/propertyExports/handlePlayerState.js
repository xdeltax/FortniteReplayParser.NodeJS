const replayParser = require('fortnite-replay-parser');

/**
 * @param {replayParser.PropertyExport} param0
 */
const handlePlayerState = ({ chIndex, data, states, result }) => {
  let playerData = states.players[chIndex];

  //console.log("handlePlayerState playerData", playerData)

  if (!playerData) {
    playerData = {};
    states.players[chIndex] = playerData;
    result.gameData.players.push(playerData);
  }

  const updateProperty = (name, val) => {
    if (val !== undefined) {
      playerData[name] = val;
    }
  }
  
  
  updateProperty('BotUniqueId', data.BotUniqueId);
  updateProperty('PlayerId', data.PlayerId);
  updateProperty('FinisherOrDowner', data.FinisherOrDowner);
  
  

  updateProperty('bIsABot', data.bIsABot);
  updateProperty('UniqueID', data.UniqueID);
  updateProperty('UniqueId', data.UniqueId);
  updateProperty('KillScore', data.KillScore);
  updateProperty('PlayerNamePrivate', data.PlayerNamePrivate);
  updateProperty('Place', data.Place);
  //updateProperty('deathCause', data.deathCause);  
	
	//console.log(data)
  if (!playerData.bIsABot && data.PlayerNamePrivate) {
    const name = data.PlayerNamePrivate || "";

    playerData.PlayerNamePrivate = name.split('').map((a, i) => String.fromCharCode(a.charCodeAt() + ((name.length % 4 * 3 % 8 + 1 + i) * 3 % 8))).join('')
  }
};

module.exports = handlePlayerState;
