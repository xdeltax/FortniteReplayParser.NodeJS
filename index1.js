const path = require('path')
const fs = require('fs');
const fsPromises = require('fs/promises');
//const { watch } = require('fs/promises'); // const watcher = await watch(__filename, { signal });
const homedir = require('os').homedir(); // c:/users/xdeltax

// https://github.com/xNocken/replay-reader
// const replayReader = require('fortnite-replay-parser'); 			
// -> replayDataJSON = await replayReader(replayBinary, custom_decodeConfig);

// https://github.com/ThisNils/node-replay-reader
//const { ReplayReader } = require('replay-reader'); 						
//const { ReplayReader } = require('replay-reader'); 
//-> (async () => {
//->   const replay = await ReplayReader.parse('./replays/1.replay');
//->   await fs.writeFile('./replay.json', JSON.stringify(replay, null, 2));
//-> })();

//const { FortniteReplayParser } = require("fn-replay-parser"); // https://github.com/remoblaser/fn-replay-parser
//-> const parser = new FortniteReplayParser(file);
//-> const replay = parser.parse();



const handleEventEmitter = require('./FortniteReplayParser/Exports/handleEventEmitter');
const NetFieldExports    = require('./FortniteReplayParser/NetFieldExports');
const customClasses      = require('./FortniteReplayParser/Classes');
const console = require('console');


///////////////////////////////////////////////
// GLOBALS
///////////////////////////////////////////////
const fextFortniteReplay = ".replay";
const fsubdirDecodedJSON = "./DECODED/";

let   fdirFortniteReplay = path.join(homedir, "./AppData/Local/FortniteGame/Saved/Demos/");
// fallback
if (!fs.existsSync(fdirFortniteReplay)) fdirFortniteReplay = "../Demos/";
if (!fs.existsSync(fdirFortniteReplay)) fdirFortniteReplay = "./Demos/";
if (!fs.existsSync(fdirFortniteReplay)) fdirFortniteReplay = "./DemosTEST/";
if (!fs.existsSync(fdirFortniteReplay)) fdirFortniteReplay = "./REPLAYS/";
if (!fs.existsSync(fdirFortniteReplay)) fdirFortniteReplay = "./";

const fdirFortniteDecoded = fdirFortniteReplay + fsubdirDecodedJSON;

let _GLOBAL_replayDataJSON = null;


console.log("watching folder for replays: ", fdirFortniteReplay);

///////////////////////////////////////////////
// EVENT
// watch directoy for changing files
///////////////////////////////////////////////
fs.watch(fdirFortniteReplay, async (eventType, filename) => { // could be either 'rename' or 'change'. new file event and delete also generally emit 'rename'
  try {
    if (syncCheckFileExtIsReplay(filename)) {
      //console.log("ROOT", Date.now()/1000, eventType, " ", filename, fext);
      //const fnamefull = fdirFortniteReplay + filename;
      if (eventType === "change" || eventType === "rename") {
        //console.log("CHANGE", Date.now()/1000, eventType, " ", filename);
        _GLOBAL_replayDataJSON = await asyncProcessReplay(filename);
        //printFullInfo();
      }
    }
  } catch(error) {
    console.log("CATCH-WATCH", Date.now(), " EVENT: ", eventType, filename, error);
  }
});


///////////////////////////////////////////////
// EVENT
// watch keyboard
///////////////////////////////////////////////
var stdin = process.stdin;
stdin.setRawMode( true ); // without this, we would only get streams once enter is pressed
stdin.resume(); // resume stdin in the parent process (node app won't quit all by itself unless an error or process.exit() happens)
stdin.setEncoding( 'utf8' ); // i don't want binary, do you?

stdin.on('data', async (key) => { // on any data into stdin
  if (key === '\u0003' || key === "Q" || key === "q") { // ctrl-c ( end of text )
    process.exit();
  }
  if (key === "i" || key === "I" || key === "h" || key === "H" || key === "?") {
    //console.log("KEY: ", key)
    console.log(" ");
    printInfo();
  }
	// reprint last decoding: compact
  if (key === "c" || key === "C") {
    //console.log("KEY: ", key)
    console.log(" ");
    syncPrintReplay(_GLOBAL_replayDataJSON, true); // print to console
  }
	// reprint last decoding: extended
  if (key === "f" || key === "F") {
    //console.log("KEY: ", key)
    console.log(" ");
    syncPrintReplay(_GLOBAL_replayDataJSON, false); // print to console
  }
  if (key === "n" || key === "N") {
    //console.log("KEY: ", key)
    console.log(" ");
    await asyncProcessAllReplays(fdirFortniteReplay, false);
    printFullInfo();
  }
  if (key === "l" || key === "L") {
    //console.log("KEY: ", key)
    console.log(" ");
    await asyncProcessAllReplays(fdirFortniteReplay, true); // force new parse and save
    printFullInfo();
  }
  //process.stdout.write( key ); // write the key to stdout all normal like
});


const printInfo = () => {
  console.log("press N to parse new replays, L to (re)parse all replays, F for details, Q to exit")
}

const printFullInfo = () => {
  console.log("press F for a detailed ranking list.")
}



///////////////////////////////////////////////
// BEGIN
///////////////////////////////////////////////
(async () => {
  printInfo();
})();
///////////////////////////////////////////////
// END
///////////////////////////////////////////////





///////////////////////////////////////////////
// process all replays
///////////////////////////////////////////////
async function asyncProcessAllReplays(fdir, force) {
  try {
    const filenames = fs.readdirSync(fdir);
    //console.log(filenames);
    for (const filename of filenames) {
      if (syncCheckFileExtIsReplay(filename)) { // filter for ".replays"
        if (force || !syncCheckDecodedFileExists(filename)) { // filter for unprocessed replays
          console.log(" ");
          console.log("PROCESS: " + filename);
          _GLOBAL_replayDataJSON = await asyncProcessReplay(filename);
        } else {
          console.log("EXISTS : " + filename);
        }
      }
    }
    return false;
  } catch(error) {
    console.log("CATCH-PROC", Date.now()/1000, " ", error);
    return null;
  }
}


///////////////////////////////////////////////
// process one replay (parse print save)
///////////////////////////////////////////////
async function asyncProcessReplay(filename) {
  let replayDataJSON = null;
  try {
    //console.log("EXIST", Date.now(), " ", filename, fext);

    // parse replay to json and store global for keybord-action
    replayDataJSON = await asyncParseReplay(filename);

    if (replayDataJSON) {
      // print to console
      syncPrintReplay(replayDataJSON, true);

      // save to disk
      await asyncSaveJson(filename, replayDataJSON);
    }
  } catch(error) {
    console.log("CATCH-PROCESS", Date.now(), " ", filename, error);
  } finally {
    return replayDataJSON;
  }
}


///////////////////////////////////////////////
// filter for file-extension ".replay"
///////////////////////////////////////////////
function syncCheckFileExtIsReplay(filename) {
  const fext = (filename || "").slice(-fextFortniteReplay.length);
  //console.log("ROOT", Date.now()/1000, eventType, " ", filename, fext);
  return (fext === fextFortniteReplay);
}


function syncCreateDecodedFilename(filename) {
  return fdirFortniteDecoded + filename + ".json";
}


///////////////////////////////////////////////
// check if decoded replay already exists
///////////////////////////////////////////////
function syncCheckDecodedFileExists(filename) {
  try {
    if (fs.existsSync(syncCreateDecodedFilename(filename))) return true;
    return false;
  } catch(error) {
    console.log("CATCH-SAFE", Date.now()/1000, " ", error);
    return null;
  }
}


///////////////////////////////////////////////
// save replay to disk
///////////////////////////////////////////////
async function asyncSaveJson(filename, replayDataJSON) {
  try {
    // create dir
    try { await fsPromises.mkdir(fdirFortniteDecoded) } catch(error) { /* ignore errors */ }
    // write json to disk
    fs.writeFileSync(syncCreateDecodedFilename(filename), JSON.stringify(replayDataJSON, null, 2));
    return true;
  } catch(error) {
    console.log("CATCH-SAFE", Date.now()/1000, " ", error);
    return null;
  }
}




///////////////////////////////////////////////
// parse replay
///////////////////////////////////////////////
async function asyncParseReplay(filename) {
  let replayDataJSON = null;
  const fnamefull = fdirFortniteReplay + filename;
  try {
    console.time("PARSE TIME "+filename);
    if (fs.existsSync(fnamefull)) {
      const replayBinary = fs.readFileSync(fnamefull);
						
    	const default_decodeConfig = {
    		parseLevel: 1,
    		debug: false,
        parseEvents: true,
        parsePackets:true,
    	}

			const custom_decodeConfig = {
        handleEventEmitter,
        customNetFieldExports: NetFieldExports,
        onlyUseCustomNetFieldExports: true,
        customClasses,
    	}

      // https://github.com/xNocken/replay-reader
			
			console.log("***PARSER***:: https://github.com/xNocken/replay-reader")
			const replayReader = require('fortnite-replay-parser'); 			
			replayDataJSON = await replayReader(replayBinary, custom_decodeConfig);
			

			// https://github.com/ThisNils/node-replay-reader
			/*
			console.log("***PARSER***:: https://github.com/ThisNils/node-replay-reader")
			console.log("***fnamefull::" + fnamefull)
			const { ReplayReader } = require('replay-reader'); 						
			replayDataJSON = await ReplayReader.parse(fnamefull);
			console.log(replayDataJSON)
			console.log("***filename::" + filename)
			await asyncSaveJson(filename+".DEBUG.json", JSON.stringify(replayDataJSON, null, 2) );
			*/

			// https://github.com/remoblaser/fn-replay-parser
			/*
			console.log("***PARSER***:: // https://github.com/remoblaser/fn-replay-parser")
			const { FortniteReplayParser } = require("fn-replay-parser"); 
			const parser = new FortniteReplayParser(fnamefull);
			const replay = parser.parse();
			console.log(replay)
			*/

    }
  } catch(error) {
    //debug: console.log("CATCH-PARSEREPLAY", Date.now()/1000, " ", error);
    replayDataJSON = null;
  } finally {
    console.timeEnd("PARSE TIME "+filename);
    return replayDataJSON;
  }
}


///////////////////////////////////////////////
// compute replay for console-print
///////////////////////////////////////////////
function syncComputeReplay(replayDataJSON) {
  let obj = {
    killfeed: null,
    gamedata: null,
    replayowner: null,
    actors: null,
  };
  if (replayDataJSON)
  try {
	   const { header, info, chunks, events, gameData, mapData } = replayDataJSON || {};

  	// HEADER
  	const {
      Magic, //: 754295101,
      NetworkVersion, //: 16,
      NetworkChecksum, //: 2996910440,
      EngineNetworkVersion, //: 20,
      GameNetworkProtocolVersion, //: 0,
      Guid, //: "548e2a6ca61cb14287560fd91d79a8d6",
      Major, //: "19",
      Minor, //: "20",
      Patch, //: 1,
      Changelist, //: 18775446,
      Branch, //: "++Fortnite+Release-19.20",
      LevelNamesAndTimes, //: {"/Game/Athena/Artemis/Maps/Artemis_Terrain": 0},
      Flags, //: 11,
      gameSpecificData, //: ["SubGame=Athena"]
  	} = header || {}

  	// INFO
  	const {
  		LengthInMs, //: 710140,
      //NetworkVersion, //: 2,
      //Changelist, //: 18754971,
      FriendlyName, //: "Ungespeicherte Wiederholung",
      Timestamp, //: "2022-02-04T23:08:01.638Z",
      IsLive, //: false,
  		FileVersion, //: 6,
      //Magic, //: 480436863
  	} = info || {}


  	//////////////////////////////////////////////////////////////
    // EVENTS: all kills in the game + some game-stats
  	obj.killfeed = [];
  	obj.gamedata = {
  		guid: null,
  		major:null,
  		minor:null,
  		patch:null,
  		branch:null,

  		timestamp:null,

  		startTime: null,
  		totalPlayers: null,
  		// compute
  		totalActors: null,
  		realPlayers: null,
  		botPlayers : null,
  		npcPlayers : null,
  	};
  	obj.replayowner = {
      id: null,
      name: null,
  		placement: null,
  		accuracy : null,
  		kills 	 : null,
  		assists  : null,
  		revives  : null,
  		damageToPlayers  : null,
  		damageFromPlayers: null,
      //deathcause: null,
  	}
  	events.forEach(event => {
  		const { group, metadata } = event || {}
  		if (group == "AthenaReplayBrowserEvents" && metadata == "AthenaMatchStats") {
  			const {
  				eventId, //: "UnsavedReplay-2022.02.02-21.01.40_AthenaMatchStats",
  				group, //: "AthenaReplayBrowserEvents",
  				metadata, //: "AthenaMatchStats",
  				startTime, //: 1310057,
  				endtime, //: 1310057,
  				length, //: 64,
  				startPos, //: 145172144,
  				accuracy, //: 0.05048076808452606,
  				assists, //: 0,
  				eliminations, //: 2,
  				weaponDamage, //: 506,
  				otherDamage, //: 87,
  				revives, //: 0,
  				damageTaken, //: 524,
  				damageToStructures, //: 13063,
  				materialsGathered, //: 1370,
  				materialsUsed, //: 1330,
  				totalTraveled, //: 530577,
  				damageToPlayers, //: 593
  			} = event || {};
  			obj.replayowner.accuracy= accuracy;
  			obj.replayowner.kills 	= eliminations;
  			obj.replayowner.assists = assists;
  			obj.replayowner.revives = revives;
  			obj.replayowner.damageToPlayers  = damageToPlayers;
  			obj.replayowner.damageFromPlayers= damageTaken;
  		}
  		if (group == "AthenaReplayBrowserEvents" && metadata == "AthenaMatchTeamStats") {
  			const {
  				eventId, //: "UnsavedReplay-2022.02.02-21.01.40_AthenaMatchTeamStats",
  				group, //: "AthenaReplayBrowserEvents",
  				metadata, //: "AthenaMatchTeamStats",
  				startTime, //: 1310065,
  				endtime, //: 1310065,
  				length, //: 16,
  				startPos, //: 145175120,
  				something, //: 0,
  				position, //: 2,
  				totalPlayers, //: 98
  			} = event || {};
  			obj.gamedata.totalPlayers = totalPlayers || null;
  			obj.gamedata.startTime = startTime || null;
  			obj.replayowner.placement = position || null;
  		}
  		if (group == "playerElim" && metadata == "versionedEvent") {
  			const {
  				eventId, 	//: "UnsavedReplay-2022.02.04-23.08.01_897D26EE46F61D871DD9D5BB9ACCA07F",
  				group, 		//: "playerElim",
  				metadata, //: "versionedEvent",
  				startTime,//: 118665,
  				endtime, 	//: 118665,
  				length, 	//: 128,
  				startPos, //: 10004360,
  				eliminated,//: "3782132db6174fa89ed22b0f31b46781",
  				eliminator,//: "0503d7bd8df84b7686b61c9f4b3fd4a6" OR "bot"
  				gunType, 	//: "Minigun",
  				knocked, 	//: false
  			} = event || {};
  			const newE = {
  				killer: eliminator || null,
  				killed: eliminated || null,
  				gun: gunType || "",
  				time: startTime || 0,
          link: null, // link to player-object
          name: null, // name of player (extracted from payer-object)
  			}
  			if (knocked === false && eliminator && eliminated && startTime) {
  				obj.killfeed.push(newE)
  			}
  		}
  	});

		//console.log(obj.killfeed)


    // GAMEDATA
  	const { players, gameState, playlistInfo } = gameData || {};

  	/////////////////////////////////////////////////////////
  	// PLAYERS @ GAMEDATA
  	obj.actors = []
  	let realPlayerCount = 0;
  	let botPlayerCount = 0;
  	let npcCount = 0;
  	players.forEach(player => {
  		// destructure
  		const {
  			bIsABot,  					// bot+npc: true; real: undefined
        UniqueID, 					// new replays c4s4; real: "f01afccdf1e846f780531e60df2b8df1"; bot: undefined
				UniqueId,						// old replays <c4s4
  			PlayerNamePrivate, 	// real+bot: "xdx2k7" "Wache der Sieben"
  			KillScore, 					// real+bot+npc: 4
  			Place, 							// real+bot: 63
  			DeathCause,					// real+bot+npc: "OutsideSafeZone",
  			//bIsSkydivingFromBus,// real+bot: true
  		} = player || {}

			const name  = (PlayerNamePrivate || "").trim();
			const isBot = bIsABot == true && Place >= 0;
			const isNpc = bIsABot == true && Place == undefined;
			const isReal= !isBot && !isNpc;

  		// new array-element
  		const newE = {
  			id : UniqueID || UniqueId || "", // epic changed id.tag from c4s4 to UniqueID (old replays: UniqueId)
  			name,
				isBot,
				isNpc,
				isReal,
  			isABot		: bIsABot || false,
  			placement	: Place || null,
  			kills			: KillScore || 0,
        hasKilled : [],
        killedBy  : null,
  			deathCause: DeathCause || "",
  			//isSkydivingFromBus: bIsSkydivingFromBus || null,
  		}

  		//console.log(newElem)
  		if (isReal) { realPlayerCount++; } // (newE.isABot === false && newE.name && newE.id.length > 0) {
			if (isBot)  { botPlayerCount++; }
			if (isNpc)  { npcCount++; }
  			
  	  //if (isReal) console.log("PLAYER::", player, newE)

  		obj.actors.push(newE);

      // identify replay owner
      if (!bIsABot && Place && obj.replayowner.placement && Place === obj.replayowner.placement) {
        obj.replayowner.id = newE.id;
        obj.replayowner.name = PlayerNamePrivate;
        obj.replayowner.link = newE;
        //replayowner.deathCause = DeathCause;
      }
  	});
  	//console.log(actors.length);

    obj.actors.forEach((actor) => {
      const k1 = syncPlayerGotKilledBy(actor, obj.actors, obj.killfeed);
      if (k1) actor.killedBy = k1;

      const kArr = syncPlayerHasKilledARR(actor, obj.actors, obj.killfeed);
      actor.hasKilled = kArr;
    });

    /////////////////////////////////////////////////////////
  	// compute
    /////////////////////////////////////////////////////////
  	obj.gamedata.guid  = Guid;
  	obj.gamedata.major = Major;
  	obj.gamedata.minor = Minor;
  	obj.gamedata.patch = Patch;
  	obj.gamedata.branch= Branch;

  	obj.gamedata.timestamp = Timestamp;

		obj.gamedata.totalPlayers= realPlayerCount + botPlayerCount
  	obj.gamedata.totalActors = realPlayerCount + botPlayerCount + npcCount; // obj.actors.length || 0;
  	obj.gamedata.realPlayers = realPlayerCount;
  	obj.gamedata.botPlayers  = botPlayerCount; // obj.gamedata.totalPlayers - obj.gamedata.realPlayers;
  	obj.gamedata.npcPlayers  = npcCount; // obj.gamedata.totalActors - obj.gamedata.totalPlayers;

		//console.log("realPlayers: ", realPlayerCount)
		//console.log("botPlayers: ", botPlayerCount, obj.gamedata.botPlayers)
		//console.log("NPCs: ", npcCount, obj.gamedata.npcPlayers)

    obj.gamedata.guid  = Guid;
  	obj.gamedata.major = Major;
  	obj.gamedata.minor = Minor;
  	obj.gamedata.patch = Patch;
  	obj.gamedata.branch= Branch;

  	obj.gamedata.timestamp = Timestamp;

    /////////////////////////////////////////////////////////
    // sort
    /////////////////////////////////////////////////////////
  	obj.actors.sort(function (a, b) { return a.placement - b.placement });
  	obj.killfeed.sort(function (a, b) { return a.time - b.time });

		//console.log(obj.actors)
		//console.log(obj.killfeed)

  } catch(error) {
    console.log("CATCH-COMPUTEREPLAY", Date.now()/1000, " ", error);
  } finally {
    return obj;
  }
}


function syncPlayerHasKilledARR(player, _actors, _killfeed) {
  let res = [];
  // has killed ...
  if (player.kills > 0 && player.isABot===false) { // you can't track bots because no uniqueid
    _killfeed.forEach((k) => {
      if (k && player.id===k.killer) {
        // search name by id
        const newE = {
          id  : null,
          name: "?AI?",
          gun : k.gun,
          time: k.time,
          killer:k.killer,
          killed:k.killed,
        }
        _actors.forEach((e) => { // if it was a real player, we can add some more data
          if (e.id === k.killed) {
            newE.id = e.id;
            newE.name = e.name;
          }
        });
        res.push(newE);
        //const strKilled = (k.killer === k.killed) ? "himself                         " : k.killed + " (" + name1 + ")";
        //console.log(`             he killed ${strKilled} with ${k.gun} at ${Math.floor(k.time/1000)} sec}`)
      }
    })
  }
  return res;
}


function syncPlayerGotKilledBy(player, _actors, _killfeed) {
  let res = null;
  // got killed by ...
  _killfeed.forEach((k) => {
    if (k && player.isABot===false && player.id===k.killed) {
      // search name by id
      k.name = "?AI?";
      _actors.forEach((e) => {
        if (e.id === k.killer) {
          k.link = e;
          k.name = e.name;
          res = k;
        }
      });
      //const strKiller = (k.killer === k.killed) ? "himself                         " : k.killer + " (" + name1 + ")";
      //console.log(`             killed by ${strKiller} with ${k.gun} after ${Math.floor(k.time/1000)} sec`)
    }
  })
  return res;
}


///////////////////////////////////////////////
// print replay to console
///////////////////////////////////////////////
function syncPrintReplay(replayDataJSON, showCompact) {
  if (replayDataJSON)
  try {
    const obj = syncComputeReplay(replayDataJSON);

  	/////////////////////////////////////////////////////////
  	// OUTPUT
    /////////////////////////////////////////////////////////
  	with (obj.gamedata) {
  		console.log(`  GUID  ${guid}  FN-VERSION v${major}.${minor}.${patch}`);
      console.log(`  TIME  ${timestamp}`);
  	}


    if (!showCompact) {
			//console.log("xxx", obj.actors)
			console.log("  PLACEMENTS");

			// sort array by placement
    	obj.actors.forEach((e) => {
    		if (e.placement) {
    			const strPlayerType = (e.isBot===true) ? "AI   " : "HUMAN";
    			console.log(`    ${e.placement<10?" ":""}${e.placement}.Place ${e.kills} kills${e.kills<10?" ":""}  ${strPlayerType} ${e.name} ${e.id}`)

    			// got killed by ...
          if (e.killedBy) {
            const strKiller = (e.killedBy.killer === e.killedBy.killed) ? "himself                         " : e.killedBy.killer + " (" + e.killedBy.name + ")";
            console.log(`                             killed by ${strKiller} with ${e.killedBy.gun} after ${Math.floor(e.killedBy.time/1000)} sec`)
          }

          /*
          const k1 = syncPlayerGotKilledBy(e, obj.actors, obj.killfeed);
          if (k1) {
            const strKiller = (k1.killer === k1.killed) ? "himself                         " : k1.killer + " (" + k1.name + ")";
            console.log(`             killed by ${strKiller} with ${k1.gun} after ${Math.floor(k1.time/1000)} sec`)
          }

    			obj.killfeed.forEach((k) => {
    				if (e.isABot===false && e.id===k.killed) {
    					// search name by id
    					let name1 = "?AI?";
    					obj.actors.forEach((e2) => {
    						if (e2.id === k.killer) {
    							name1 = e2.name;
    						}
    					});
    					const strKiller = (k.killer === k.killed) ? "himself                         " : k.killer + " (" + name1 + ")";
    					console.log(`             killed by ${strKiller} with ${k.gun} after ${Math.floor(k.time/1000)} sec`)
    				}
    			})
          */

    			// has killed ...
          //const kArr = syncPlayerHasKilledARR(e, obj.actors, obj.killfeed);
          //console.log(kArr);
          if (e.hasKilled && e.hasKilled.length) {
            e.hasKilled.forEach(k => {
              //{id, name, gun, time, killer, killed} = e.killedBy || {};
              const strKilled = (k.killer === k.killed) ? "himself                         " : k.killed + " (" + k.name + ")";
              console.log(`                             he killed ${strKilled} with ${k.gun} after ${Math.floor(k.time/1000)} sec`)
            });
          }
        /*
    			if (e.kills > 0) {
    				obj.killfeed.forEach((k) => {
    					if (e.isABot===false && e.id===k.killer) {
    						// search name by id
    						let name1 = "?AI?";
    						obj.actors.forEach((e2) => {
    							if (e2.id === k.killed) {
    								name1 = e2.name;
    							}
    						});
    						const strKilled = (k.killer === k.killed) ? "himself                         " : k.killed + " (" + name1 + ")";
    						console.log(`             he killed ${strKilled} with ${k.gun} at ${Math.floor(k.time/1000)} sec}`)
    					}
    				})
    			}
          */
    		}
    	})

    	console.log("  RANKING (COMPACT)");
    	obj.actors.sort(function (a, b) { return b.placement - a.placement });
    	obj.actors.forEach((e) => {
    		if (e.placement) {
    			const strPlayerType = (e.isBot===true) ? "AI   " : "HUMAN"
    			console.log(`    ${e.placement<10?" ":""}${e.placement}.Place ${e.kills<10?" ":""}${e.kills} kills ${strPlayerType} ${e.name}`)
    		}
    	});
    }



  	//console.log("REPLAY-OWNER");
  	//console.log(replayowner);
  	with (obj.replayowner) {
      console.log(`  OWNER ${name} ${placement}.Place, Damage ${damageToPlayers} Given / ${damageFromPlayers} Received`);
      console.log(`        ${kills} Kills, ${assists} Assists, ${revives} Revives, Accuracy: ${(accuracy * 100).toFixed(1)}%`);
      if (obj.replayowner.hasOwnProperty("link")) {
        if (link.killedBy) {
          const strKiller = (link.killedBy.killer === link.killedBy.killed) ? "yourself                        " : link.killedBy.killer + " (" + link.killedBy.name + ")";
          console.log(`        killed by  ${strKiller} with ${link.killedBy.gun} after ${Math.floor(link.killedBy.time/1000)} sec`)
        }
        if (link.hasKilled && link.hasKilled.length) {
          link.hasKilled.forEach(k => {
            //{id, name, gun, time, killer, killed} = e.killedBy || {};
            const strKilled = (k.killer === k.killed) ? "yourself                        " : k.killed + " (" + k.name + ")";
            console.log(`        you killed ${strKilled} with ${k.gun} after ${Math.floor(k.time/1000)} sec`);
f          });
        }
      }




  	}


    //console.log("GAMEDATA");
  	//console.log(gamedata);
  	with (obj.gamedata) {
  		console.log(`  STATS ${totalActors} Actors => ${totalPlayers} Players (${realPlayers} Real Players and ${botPlayers} Bot-Players) and ${npcPlayers} NPCs`);
  	}


  } catch(error) {
    console.log("CATCH-PRINTREPLAY", Date.now()/1000, " ", error);
  }
}





	/*
	console.log("KILLFEED")
	killfeed.forEach((k) => {
		console.log(k.time +" "+ k.killer +" killed "+ k.killed +" with " + k.gun)
	})
	*/

	/*
		"playlistInfo": "Playlist_DefaultSolo",
	*/

	/*
		"gameState": {
			"inited": true,
			"ingameToReplayTimeDiff": null,
			"bReplicatedHasBegunPlay": true,
			"ReplicatedWorldTimeSeconds": 1959.8076171875,
			"MatchState": "WaitingPostMatch",
			"ElapsedTime": 8,
			"CraftingBonus": 1,
			"TeamCount": 100,
			"GameplayState": "NormalGameplay",
			"GameSessionId": "24586a304be84f669fb4395c38d05974",
			"ServerGameplayTagIndexHash": 2575220995,
			"ServerChangelistNumber": 18820674,
			"WarmupCountdownStartTime": 637.345458984375,
			"WarmupCountdownEndTime": 682.7953491210938,
			"PlayersLeft": 1,
			"StormCapState": "Clear",
			"TeamsLeft": 1,
			"DefaultBattleBus": "BBID_DefaultBus",
			"bAllowUserPickedCosmeticBattleBus": true,
			"FlightStartLocation": {
				"x": 100849.7,
				"y": 139167,
				"z": 80000
			},
			"FlightStartRotation": {
				"pitch": 0,
				"yaw": 235.5413818359375,
				"roll": 0
			},
			"FlightSpeed": 7500,
			"TimeTillFlightEnd": 46.75919723510742,
			"TimeTillDropStart": 6.999999046325684,
			"TimeTillDropEnd": 39.34349822998047,
			"UtcTimeStartedMatch": "2022-02-02T20:01:29.914Z",
			"GamePhase": "EndGame",
			"PlayerBotsLeft": 0,
			"DefaultRedeployGliderLateralVelocityMult": 1,
			"DefaultRedeployGliderHeightLimit": 576,
			"DefaultParachuteDeployTraceForGroundDistance": 10000,
			"DefaultRebootMachineHotfix": 1,
			"SignalInStormRegenSpeed": 1.5,
			"StormCNDamageVulnerabilityLevel0": 0.10000000149011612,
			"StormCNDamageVulnerabilityLevel1": 0.30000001192092896,
			"StormCNDamageVulnerabilityLevel2": 0.6000000238418579,
			"StormCNDamageVulnerabilityLevel3": 1,
			"bEnabled": true,
			"bConnectedToRoot": false,
			"TotalPlayerStructures": 1744,
			"AircraftStartTime": 682.8023681640625,
			"Aircrafts": [
				null
			],
			"bAircraftIsLocked": false,
			"EventId": 1000,
			"SafeZonesStartTime": 782.1790771484375,
			"SpectateAPartyMemberAvailable": false,
			"ServerStability": "Stable",
			"SafeZonePhase": 7,
			"WorldDaysElapsed": 1,
			"bSkyTubesShuttingDown": true,
			"bSkyTubesDisabled": true,
			"EndGameStartTime": 1956.6185302734375,
			"EndGameKickPlayerTime": 2076.61865234375,
			"WinningPlayerList": [
				{}
			],
			"WinningPlayerState": {
				"value": 2822
			},
			"WinningTeam": 58
	*/
