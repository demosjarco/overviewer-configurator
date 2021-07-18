'use strict';

const { app } = require('electron');
const electron = require('./electronSetup.js');
const logging = require('./logging.js');
const fs = require('fs');
let ConfigManager;

let runningJson = {};

module.exports = class SettingsManager {
	constructor() {
		const confMan = require("./configManager.js");
		ConfigManager = new confMan();

		getSavedJSON(null);
	}

	getJson(jsonCallback) {
		getSavedJSON(jsonCallback);
	}

	updateWorldsPath(path) {
		runningJson.global.worldsLocation = path;
		saveJSON(runningJson);
	}
	updateMapsPath(path) {
		runningJson.global.outputLocation = path;
		saveJSON(runningJson);
	}

	getWorldsLocation() {
		return runningJson.global.worldsLocation;
	}

	addWorld(filePath, needMoreInfo) {
		const worldFound = runningJson.worlds.filter(world => (world.path === filePath));
		if (worldFound.length == 1) {
			// Exist
			electron.mainWindow.webContents.send('foundWorld', worldFound[0]);
			logging.messageLog('Found world: [' + worldFound[0].sc + '] ' + worldFound[0].name);
		} else if (worldFound.length > 1) {
			// Clear Duplicates
			electron.mainWindow.webContents.send('foundWorld', worldFound.pop());
			worldFound.forEach((item) => {
				runningJson.worlds.splice(runningJson.worlds.indexOf(item), 1);
			});
			runningJson.worlds.sort((a, b) => (a.sc > b.sc) ? 1 : (a.sc === b.sc) ? ((a.name > b.name) ? 1 : -1) : -1);
			saveJSON(runningJson);
		} else {
			// New Entry
			let newWorld = {
				enabled: true,
				renderTypes: {
					day: {
						enabled: true,
						smoothLighting: true,
						directions: {
							ul: true,
							ur: false,
							ll: false,
							lr: false
						},
						markers: {
							sign: true,
							chest: true,
							player: true
						}
					},
					caves: {
						enabled: true,
						smoothLighting: true,
						directions: {
							ul: true,
							ur: false,
							ll: false,
							lr: false
						},
						markers: {
							sign: true,
							chest: true,
							player: true
						}
					},
					night: {
						enabled: true,
						smoothLighting: true,
						directions: {
							ul: true,
							ur: false,
							ll: false,
							lr: false
						},
						markers: {
							sign: true,
							chest: true,
							player: true
						}
					},
					nether: {
						enabled: true,
						smoothLighting: true,
						directions: {
							ul: true,
							ur: false,
							ll: false,
							lr: false
						},
						markers: {
							sign: true,
							chest: true,
							player: true
						}
					},
					end: {
						enabled: true,
						smoothLighting: true,
						directions: {
							ul: true,
							ur: false,
							ll: false,
							lr: false
						},
						markers: {
							sign: true,
							chest: true,
							player: true
						}
					}
				},
				overlayTypes: {
					minerals: {
						day: true,
						caves: true,
						night: true
					},
					spawn: {
						day: true,
						caves: true,
						night: true
					}
				}
			};
			needMoreInfo(filePath, (codeName, worldName) => {
				newWorld.name = worldName;
				newWorld.path = filePath;
				newWorld.sc = codeName;
				electron.mainWindow.webContents.send('foundWorld', newWorld);
				runningJson.worlds.push(newWorld);
				runningJson.worlds.sort((a, b) => (a.sc > b.sc) ? 1 : (a.sc === b.sc) ? ((a.name > b.name) ? 1 : -1) : -1);
				saveJSON(runningJson);
				logging.messageLog('Found world: [' + worldFound[0].sc + '] ' + worldFound[0].name);
			});
		}
		ConfigManager.updateConfig(runningJson);
	}
}

const settingsPath = app.getPath('userData').replace(/\\/g, "/") + '/settings.json';

let jsonSaveQueue = [];
let jsonSaveQueueProcessing = false;
function processJsonWriteQueue() {
	jsonSaveQueueProcessing = true;
	let json = jsonSaveQueue.shift();
	fs.writeFile(settingsPath, JSON.stringify(json, null, 4), (err) => {
		if (err) throw err;

		if (jsonSaveQueue.length > 0) {
			processJsonWriteQueue();
		} else {
			jsonSaveQueueProcessing = false;
		}
	});
	ConfigManager.updateConfig(json);
}

let jsonReadQueue = [];
let jsonReadQueueProcessing = false;
function processJsonReadQueue() {
	let callback = jsonReadQueue.shift();
	if (Object.keys(runningJson).length > 0) {
		updatePreferencesFileIfNeeded(function (json) {
			if (callback)
				callback(json);

			if (jsonReadQueue.length > 0) {
				processJsonReadQueue();
			} else {
				jsonReadQueueProcessing = false;
			}
		}, runningJson);
	} else {
		fs.readFile(settingsPath, (err, data) => {
			updatePreferencesFileIfNeeded(function (json) {
				runningJson = json;
				if (callback)
					callback(json);

				if (jsonReadQueue.length > 0) {
					processJsonReadQueue();
				} else {
					jsonReadQueueProcessing = false;
				}
			}, (err || !data) ? {} : JSON.parse(data));
		});
	}

	function updatePreferencesFileIfNeeded(finishedCallback, json = {}) {
		let tempJson = json;
		let changed = false;
		if (!('global' in json)) {
			changed = true;
			tempJson.global = {
				worldsLocation: null,
				outputLocation: null,
				imageSettings: {
					format: 'png',
					png: {
						compressionLevel: 2
					},
					jpg: {
						imgquality: 95,
					},
					webp: {
						compressionLevel: 95,
						imglossless: true
					}
				},
				caveDepthShading: true,
				renderProgress: {
					local: true,
					web: false
				}
			};
		} else {
			if (!('worldsLocation' in json.global)) {
				changed = true;
				tempJson.global.worldsLocation = null;
			}
			if (!('outputLocation' in json.global)) {
				changed = true;
				tempJson.global.outputLocation = null;
			}
			if (!('imageSettings' in json.global)) {
				changed = true;
				tempJson.global.imageSettings = {
					format: 'png',
					png: {
						compressionLevel: 2
					},
					jpg: {
						imgquality: 95
					},
					webp: {
						compressionLevel: 95,
						imglossless: true
					}
				};
			} else {
				if (!('format' in json.global.imageSettings)) {
					changed = true;
					tempJson.global.imageSettings.format = 'png';
				}
				if (!('png' in json.global.imageSettings)) {
					changed = true;
					tempJson.global.imageSettings.png = {
						compressionLevel: 2
					};
				} else {
					if (!('compressionLevel' in tempJson.global.imageSettings.png)) {
						changed = true;
						tempJson.global.imageSettings.png.compressionLevel = 2;
					}
				}
				if (!('jpg' in json.global.imageSettings)) {
					changed = true;
					tempJson.global.imageSettings.jpg = {
						imgquality: 95
					};
				} else {
					if (!('imgquality' in tempJson.global.imageSettings.jpg)) {
						changed = true;
						tempJson.global.imageSettings.jpg.imgquality = 2;
					}
				}
				if (!('webp' in json.global.imageSettings)) {
					changed = true;
					tempJson.global.imageSettings.webp = {
						compressionLevel: 95,
						imglossless: true
					};
				} else {
					if (!('compressionLevel' in tempJson.global.imageSettings.webp)) {
						changed = true;
						tempJson.global.imageSettings.webp.compressionLevel = 2;
					}
					if (!('imglossless' in tempJson.global.imageSettings.webp)) {
						changed = true;
						tempJson.global.imageSettings.webp.imglossless = true;
					}
				}
			}
			if (!('caveDepthShading' in json.global)) {
				changed = true;
				tempJson.global.caveDepthShading = true;
			}
			if (!('renderProgress' in json.global)) {
				changed = true;
				tempJson.global.renderProgress = {
					local: true,
					web: false
				};
			} else {
				if (!('local' in json.global.renderProgress)) {
					changed = true;
					tempJson.global.renderProgress.local = true;
				}
				if (!('web' in json.global.renderProgress)) {
					changed = true;
					tempJson.global.renderProgress.web = true;
				}
			}
		}

		
		if (!('markers' in json)) {
			changed = true;
			tempJson.markers = {
				signs: {
					name: 'Signs',
					filterFunction: {},
					customFilterFunction: 'def signIcons(poi):\n\t\tif poi["id"] == "minecraft:sign":\n\t\t\treturn "\\n".join([poi["Text1"], poi["Text2"], poi["Text3"], poi["Text4"]])\n',
					icon: null,
					createInfoWindow: true,
					checked: false
				},
				chests: {

				},
				players: {

				}
			};
		} else {
			if (!('signs' in json.markers)) {
				changed = true;
				tempJson.markers.signs = {
					name: 'Signs',
					filterFunction: {},
					customFilterFunction: 'def signFilter(poi):\n\tif poi["id"] == "minecraft:sign":\n\t\treturn "\\n".join([poi["Text1"], poi["Text2"], poi["Text3"], poi["Text4"]])',
					icon: null,
					createInfoWindow: true,
					checked: false
				};
			} else {
				if (!('name' in json.markers.signs)) {
					changed = true;
					tempJson.markers.signs.name = 'Signs';
				}
				if (!('filterFunction' in json.markers.signs)) {
					changed = true;
					tempJson.markers.signs.filterFunction = {};
				}
				if (!('customFilterFunction' in json.markers.signs)) {
					changed = true;
					tempJson.markers.signs.customFilterFunction = 'def signFilter(poi):\n\tif poi["id"] == "minecraft:sign":\n\t\treturn "\\n".join([poi["Text1"], poi["Text2"], poi["Text3"], poi["Text4"]])';
				}
				if (!('icon' in json.markers.signs)) {
					changed = true;
					tempJson.markers.signs.icon = null;
				} if (!('createInfoWindow' in json.markers.signs)) {
					changed = true;
					tempJson.markers.signs.createInfoWindow = true;
				} if (!('checked' in json.markers.signs)) {
					changed = true;
					tempJson.markers.signs.checked = false;
				}
			}
			if (!('chests' in json.markers)) {
				changed = true;
				tempJson.markers.chests = {
					name: 'Chests',
					filterFunction: {},
					customFilterFunction: 'def chestFilter(poi):\n\tif poi["id"] == "minecraft:chest":\n\t\treturn "Chest with %d items" % len(poi.get("Items", []))',
					icon: 'chest.png',
					createInfoWindow: true,
					checked: false
				};
			} else {
				if (!('name' in json.markers.chests)) {
					changed = true;
					tempJson.markers.chests.name = 'Chests';
				}
				if (!('filterFunction' in json.markers.chests)) {
					changed = true;
					tempJson.markers.chests.filterFunction = {};
				}
				if (!('customFilterFunction' in json.markers.chests)) {
					changed = true;
					tempJson.markers.chests.customFilterFunction = 'def chestFilter(poi):\n\tif poi["id"] == "minecraft:chest":\n\t\treturn "Chest with %d items" % len(poi.get("Items", []))';
				}
				if (!('icon' in json.markers.chests)) {
					changed = true;
					tempJson.markers.chests.icon = 'chest.png';
				} if (!('createInfoWindow' in json.markers.chests)) {
					changed = true;
					tempJson.markers.chests.createInfoWindow = true;
				} if (!('checked' in json.markers.chests)) {
					changed = true;
					tempJson.markers.chests.checked = false;
				}
			}
			if (!('players' in json.markers)) {
				changed = true;
				tempJson.markers.players = {
					name: 'Players',
					filterFunction: {},
					customFilterFunction: 'def playerFilter(poi):\n\tif poi["id"] == "Player":\n\t\tpoi["icon"] = "https://overviewer.org/avatar/%s" % poi["EntityId"]\n\t\treturn "Last known location for %s" % poi["EntityId"]',
					icon: null,
					createInfoWindow: true,
					checked: true
				};
			} else {
				if (!('name' in json.markers.players)) {
					changed = true;
					tempJson.markers.players.name = 'Players';
				}
				if (!('filterFunction' in json.markers.players)) {
					changed = true;
					tempJson.markers.players.filterFunction = {};
				}
				if (!('customFilterFunction' in json.markers.players)) {
					changed = true;
					tempJson.markers.players.customFilterFunction = 'def playerFilter(poi):\n\tif poi["id"] == "Player":\n\t\tpoi["icon"] = "https://overviewer.org/avatar/%s" % poi["EntityId"]\n\t\treturn "Last known location for %s" % poi["EntityId"]';
				}
				if (!('icon' in json.markers.players)) {
					changed = true;
					tempJson.markers.players.icon = null;
				} if (!('createInfoWindow' in json.markers.players)) {
					changed = true;
					tempJson.markers.players.createInfoWindow = true;
				} if (!('checked' in json.markers.players)) {
					changed = true;
					tempJson.markers.players.checked = true;
				}
			}
		}

		if (!('worlds' in json)) {
			changed = true;
			tempJson.worlds = [];
		}

		if (changed)
			saveJSON(tempJson);
		if (finishedCallback)
			finishedCallback(tempJson);
	}
}

function getSavedJSON(jsonCallback) {
	jsonReadQueue.push(jsonCallback);
	if (jsonReadQueue.length > 0 && !jsonReadQueueProcessing) {
		processJsonReadQueue();
	}
}

function saveJSON(updatedJSON) {
	runningJson = updatedJSON;
	jsonSaveQueue.push(updatedJSON);
	if (jsonSaveQueue.length > 0 && !jsonSaveQueueProcessing) {
		processJsonWriteQueue();
	}
}