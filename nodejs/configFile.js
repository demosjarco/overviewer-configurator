const { app, dialog } = require('electron');
const fs = require('fs');

let jsonSaveQueue = [];
let jsonSaveQueueProcessing = false;
let permJson = {};
function processJsonWriteQueue() {
	let json = jsonSaveQueue.shift();
	fs.writeFile(app.getPath('userData').replace(/\\/g, "/") + '/settings.json', JSON.stringify(json, null, 4), (err) => {
		if (err) throw err;

		savePyConfigFile();

		if (jsonSaveQueue.length > 0) {
			processJsonWriteQueue();
		} else {
			jsonSaveQueueProcessing = false;
		}
	});
}

let jsonReadQueue = [];
let jsonReadQueueProcessing = false;
function processJsonReadQueue() {
	let callback = jsonReadQueue.shift();
	if (Object.keys(permJson).length > 0) {
		updatePreferencesFileIfNeeded(function (json) {
			if (callback)
				callback(json);

			if (jsonReadQueue.length > 0) {
				processJsonReadQueue();
			} else {
				jsonReadQueueProcessing = false;
			}
		}, permJson);
	} else {
		fs.readFile(app.getPath('userData').replace(/\\/g, "/") + '/settings.json', (err, data) => {
			updatePreferencesFileIfNeeded(function (json) {
				permJson = json;
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
				caveDepthShading: true,
				compressLevel: 2,
				outputLocation: null,
				renderProgress: {
					local: true,
					web: false
				},
				worldsLocation: null
			};
		} else {
			if (!('caveDepthShading' in json.global)) {
				changed = true;
				tempJson.global.caveDepthShading = true;
			}
			if (!('compressLevel' in json.global)) {
				changed = true;
				tempJson.global.compressLevel = 2;
			}
			if (!('outputLocation' in json.global)) {
				changed = true;
				tempJson.global.outputLocation = null;
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
			if (!('worldsLocation' in json.global)) {
				changed = true;
				tempJson.global.worldsLocation = null;
			}
		}

		if (!('worlds' in json)) {
			changed = true;
			tempJson.worlds = {};
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
		jsonReadQueueProcessing = true;
		processJsonReadQueue();
	}
}
// First time setup
getSavedJSON(null);

function saveJSON(updatedJSON) {
	permJson = updatedJSON;
	jsonSaveQueue.push(updatedJSON);
	if (jsonSaveQueue.length > 0 && !jsonSaveQueueProcessing) {
		jsonSaveQueueProcessing = true;
		processJsonWriteQueue();
	}
}

module.exports.changedSetting = function (optionValue, settingType, optionKey1, optionKey2, optionKey3, optionKey4, optionKey5) {
	getSavedJSON(function (json) {
		let tempJSON = json;
		if (optionKey1 && optionKey2 && optionKey3 && optionKey4 && optionKey5) {
			tempJSON[settingType][optionKey1][optionKey2][optionKey3][optionKey4][optionKey5] = optionValue;
		} else if (optionKey1 && optionKey2 && optionKey3 && optionKey4) {
			tempJSON[settingType][optionKey1][optionKey2][optionKey3][optionKey4] = optionValue;
		} else if (optionKey1 && optionKey2 && optionKey3) {
			tempJSON[settingType][optionKey1][optionKey2][optionKey3] = optionValue;
		} else if (optionKey1 && optionKey2) {
			tempJSON[settingType][optionKey1][optionKey2] = optionValue;
		} else if (optionKey1) {
			tempJSON[settingType][optionKey1] = optionValue;
		}
		saveJSON(tempJSON);
	});
}

function readSetting(settingCallback, settingType, optionKey1, optionKey2, optionKey3, optionKey4) {
	getSavedJSON(function (json) {
		if (optionKey1 && optionKey2 && optionKey3 && optionKey4) {
			settingCallback(json[settingType][optionKey1][optionKey2][optionKey3][optionKey4]);
		} else if (optionKey1 && optionKey2 && optionKey3) {
			settingCallback(json[settingType][optionKey1][optionKey2][optionKey3]);
		} else if (optionKey1 && optionKey2) {
			settingCallback(json[settingType][optionKey1][optionKey2]);
		} else if (optionKey1) {
			settingCallback(json[settingType][optionKey1]);
		}
	});
}

module.exports.getWorldLocationPath = function (callback) {
	readSetting(function (value) {
		callback(value);
	}, 'global', 'worldsLocation');
}

const electron = require('./electronSetup.js');
module.exports.readOldSettings = function () {
	module.exports.getWorldLocationPath(function (value) {
		electron.mainWindow.webContents.send('readSetting_global_worldsLocation', value);
	});
	readSetting(function (value) {
		electron.mainWindow.webContents.send('readSetting_global_outputLocation', value);
	}, 'global', 'outputLocation');
	readSetting(function (value) {
		electron.mainWindow.webContents.send('readSetting_global_renderProgress_local', value);
	}, 'global', 'renderProgress', 'local');
	readSetting(function (value) {
		electron.mainWindow.webContents.send('readSetting_global_renderProgress_web', value);
	}, 'global', 'renderProgress', 'web');
	readSetting(function (value) {
		electron.mainWindow.webContents.send('readSetting_global_compressLevel', value);
	}, 'global', 'compressLevel');
	readSetting(function (value) {
		electron.mainWindow.webContents.send('readSetting_global_caveDepthShading', value);
	}, 'global', 'caveDepthShading');
}

module.exports.outputFolderSelection = function () {
	dialog.showOpenDialog({
		properties: ['openDirectory']
	}, function (filePaths, bookmarks) {
		if (filePaths && filePaths.length > 0) {
			let path = filePaths[0].replace(/\\/g, "/");
			module.exports.changedSetting(path, 'global', 'outputLocation');
			electron.mainWindow.webContents.send('readSetting_global_outputLocation', path);
		}
	});
}

module.exports.updateWorldConfig = function (worldKey, worldName, worldPath, worldDirections, worldEnabled, renderTypes) {
	let changed = false;
	getSavedJSON(function (json) {
		let tempJSON = json;
		if (!(worldKey in json.worlds)) {
			json.worlds[worldKey] = {
				directions: {
					ul: true,
					ur: false,
					lr: false,
					ll: false
				},
				enabled: true,
				name: worldName,
				path: worldPath,
				renderTypes: {
					day: {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					},
					caves: {
						enabled: true,
						updateMode: 0
					},
					night: {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					},
					minerals: {
						enabled: true,
						updateMode: 0
					},
					spawn: {
						enabled: true,
						updateMode: 0
					},
					nether: {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					},
					end: {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					}
				}
			}
			changed = true;
		} else {
			if (!('directions' in json.worlds[worldKey])) {
				json.worlds[worldKey].directions = {
					ul: true,
					ur: false,
					lr: false,
					ll: false
				};
				changed = true;
			} else {
				if (!('ul' in json.worlds[worldKey].directions)) {
					json.worlds[worldKey].directions.ul = true;
					changed = true;
				}
				if (!('ur' in json.worlds[worldKey].directions)) {
					json.worlds[worldKey].directions.ur = false;
					changed = true;
				}
				if (!('ll' in json.worlds[worldKey].directions)) {
					json.worlds[worldKey].directions.ll = false;
					changed = true;
				}
				if (!('lr' in json.worlds[worldKey].directions)) {
					json.worlds[worldKey].directions.lr = false;
					changed = true;
				}
			}
			if (!('enabled' in json.worlds[worldKey])) {
				json.worlds[worldKey].enabled = true;
				changed = true;
			}
			if (!('name' in json.worlds[worldKey])) {
				json.worlds[worldKey].name = worldName;
				changed = true;
			}
			if (!('path' in json.worlds[worldKey])) {
				json.worlds[worldKey].path = worldPath;
				changed = true;
			}
			if (!('renderTypes' in json.worlds[worldKey])) {
				json.worlds[worldKey].renderTypes = {
					day: {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					},
					caves: {
						enabled: true,
						updateMode: 0
					},
					night: {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					},
					minerals: {
						enabled: true,
						updateMode: 0
					},
					spawn: {
						enabled: true,
						updateMode: 0
					},
					nether: {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					},
					end: {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					}
				};
				changed = true;
			} else {
				if (!('day' in json.worlds[worldKey].renderTypes)) {
					json.worlds[worldKey].renderTypes.day = {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					};
					changed = true;
				} else {
					if (!('enabled' in json.worlds[worldKey].renderTypes.day)) {
						json.worlds[worldKey].renderTypes.day.enabled = true;
						changed = true;
					}

					if (!('smoothLighting' in json.worlds[worldKey].renderTypes.day)) {
						json.worlds[worldKey].renderTypes.day.smoothLighting = true;
						changed = true;
					}

					if (!('updateMode' in json.worlds[worldKey].renderTypes.day)) {
						json.worlds[worldKey].renderTypes.day.updateMode = 0;
						changed = true;
					}
				}
				if (!('caves' in json.worlds[worldKey].renderTypes)) {
					json.worlds[worldKey].renderTypes.caves = {
						enabled: true,
						updateMode: 0
					};
					changed = true;
				} else {
					if (!('enabled' in json.worlds[worldKey].renderTypes.caves)) {
						json.worlds[worldKey].renderTypes.caves.enabled = true;
						changed = true;
					}

					if (!('updateMode' in json.worlds[worldKey].renderTypes.caves)) {
						json.worlds[worldKey].renderTypes.caves.updateMode = 0;
						changed = true;
					}
				}
				if (!('night' in json.worlds[worldKey].renderTypes)) {
					json.worlds[worldKey].renderTypes.night = {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					};
					changed = true;
				} else {
					if (!('enabled' in json.worlds[worldKey].renderTypes.night)) {
						json.worlds[worldKey].renderTypes.night.enabled = true;
						changed = true;
					}

					if (!('smoothLighting' in json.worlds[worldKey].renderTypes.night)) {
						json.worlds[worldKey].renderTypes.night.smoothLighting = true;
						changed = true;
					}

					if (!('updateMode' in json.worlds[worldKey].renderTypes.night)) {
						json.worlds[worldKey].renderTypes.night.updateMode = 0;
						changed = true;
					}
				}
				if (!('minerals' in json.worlds[worldKey].renderTypes)) {
					json.worlds[worldKey].renderTypes.minerals = {
						enabled: true,
						updateMode: 0
					};
					changed = true;
				} else {
					if (!('enabled' in json.worlds[worldKey].renderTypes.minerals)) {
						json.worlds[worldKey].renderTypes.minerals.enabled = true;
						changed = true;
					}

					if (!('updateMode' in json.worlds[worldKey].renderTypes.minerals)) {
						json.worlds[worldKey].renderTypes.minerals.updateMode = 0;
						changed = true;
					}
				}
				if (!('spawn' in json.worlds[worldKey].renderTypes)) {
					json.worlds[worldKey].renderTypes.spawn = {
						enabled: true,
						updateMode: 0
					};
					changed = true;
				} else {
					if (!('enabled' in json.worlds[worldKey].renderTypes.spawn)) {
						json.worlds[worldKey].renderTypes.spawn.enabled = true;
						changed = true;
					}

					if (!('updateMode' in json.worlds[worldKey].renderTypes.spawn)) {
						json.worlds[worldKey].renderTypes.spawn.updateMode = 0;
						changed = true;
					}
				}
				if (!('nether' in json.worlds[worldKey].renderTypes)) {
					json.worlds[worldKey].renderTypes.nether = {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					};
					changed = true;
				} else {
					if (!('enabled' in json.worlds[worldKey].renderTypes.nether)) {
						json.worlds[worldKey].renderTypes.nether.enabled = true;
						changed = true;
					}

					if (!('smoothLighting' in json.worlds[worldKey].renderTypes.nether)) {
						json.worlds[worldKey].renderTypes.nether.smoothLighting = true;
						changed = true;
					}

					if (!('updateMode' in json.worlds[worldKey].renderTypes.nether)) {
						json.worlds[worldKey].renderTypes.nether.updateMode = 0;
						changed = true;
					}
				}
				if (!('end' in json.worlds[worldKey].renderTypes)) {
					json.worlds[worldKey].renderTypes.end = {
						enabled: true,
						smoothLighting: true,
						updateMode: 0
					};
					changed = true;
				} else {
					if (!('enabled' in json.worlds[worldKey].renderTypes.end)) {
						json.worlds[worldKey].renderTypes.end.enabled = true;
						changed = true;
					}

					if (!('smoothLighting' in json.worlds[worldKey].renderTypes.end)) {
						json.worlds[worldKey].renderTypes.end.smoothLighting = true;
						changed = true;
					}

					if (!('updateMode' in json.worlds[worldKey].renderTypes.end)) {
						json.worlds[worldKey].renderTypes.end.updateMode = 0;
						changed = true;
					}
				}
			}

			if (worldDirections) {
				if (('ul' in worldDirections)) {
					json.worlds[worldKey].directions.ul = worldDirections.ul;
					changed = true;
				}
				if (('ur' in worldDirections)) {
					json.worlds[worldKey].directions.ur = worldDirections.ur;
					changed = true;
				}
				if (('lr' in worldDirections)) {
					json.worlds[worldKey].directions.lr = worldDirections.lr;
					changed = true;
				}
				if (('ll' in worldDirections)) {
					json.worlds[worldKey].directions.ll = worldDirections.ll;
					changed = true;
				}
			}

			if (worldEnabled) {
				json.worlds[worldKey].enabled = worldEnabled;
				changed = true;
			}

			if (renderTypes) {
				if (('day' in renderTypes)) {
					if (('enabled' in renderTypes.day)) {
						json.worlds[worldKey].renderTypes.day.enabled = renderTypes.day.enabled;
						changed = true;
					}
					if (('smoothLighting' in renderTypes.day)) {
						json.worlds[worldKey].renderTypes.day.smoothLighting = renderTypes.day.smoothLighting;
						changed = true;
					}
					if (('updateMode' in renderTypes.day)) {
						json.worlds[worldKey].renderTypes.day.updateMode = renderTypes.day.updateMode;
						changed = true;
					}
				}
				if (('caves' in renderTypes)) {
					if (('enabled' in renderTypes.caves)) {
						json.worlds[worldKey].renderTypes.caves.enabled = renderTypes.caves.enabled;
						changed = true;
					}
					if (('updateMode' in renderTypes.caves)) {
						json.worlds[worldKey].renderTypes.caves.updateMode = renderTypes.caves.updateMode;
						changed = true;
					}
				}
				if (('night' in renderTypes)) {
					if (('enabled' in renderTypes.night)) {
						json.worlds[worldKey].renderTypes.night.enabled = renderTypes.night.enabled;
						changed = true;
					}
					if (('smoothLighting' in renderTypes.night)) {
						json.worlds[worldKey].renderTypes.night.smoothLighting = renderTypes.night.smoothLighting;
						changed = true;
					}
					if (('updateMode' in renderTypes.night)) {
						json.worlds[worldKey].renderTypes.night.updateMode = renderTypes.night.updateMode;
						changed = true;
					}
				}
				if (('minerals' in renderTypes)) {
					if (('enabled' in renderTypes.minerals)) {
						json.worlds[worldKey].renderTypes.minerals.enabled = renderTypes.minerals.enabled;
						changed = true;
					}
					if (('updateMode' in renderTypes.minerals)) {
						json.worlds[worldKey].renderTypes.minerals.updateMode = renderTypes.minerals.updateMode;
						changed = true;
					}
				}
				if (('spawn' in renderTypes)) {
					if (('enabled' in renderTypes.spawn)) {
						json.worlds[worldKey].renderTypes.spawn.enabled = renderTypes.spawn.enabled;
						changed = true;
					}
					if (('updateMode' in renderTypes.spawn)) {
						json.worlds[worldKey].renderTypes.spawn.updateMode = renderTypes.spawn.updateMode;
						changed = true;
					}
				}
				if (('nether' in renderTypes)) {
					if (('enabled' in renderTypes.nether)) {
						json.worlds[worldKey].renderTypes.nether.enabled = renderTypes.nether.enabled;
						changed = true;
					}
					if (('smoothLighting' in renderTypes.nether)) {
						json.worlds[worldKey].renderTypes.nether.smoothLighting = renderTypes.nether.smoothLighting;
						changed = true;
					}
					if (('updateMode' in renderTypes.nether)) {
						json.worlds[worldKey].renderTypes.nether.updateMode = renderTypes.nether.updateMode;
						changed = true;
					}
				}
				if (('end' in renderTypes)) {
					if (('enabled' in renderTypes.end)) {
						json.worlds[worldKey].renderTypes.end.enabled = renderTypes.end.enabled;
						changed = true;
					}
					if (('smoothLighting' in renderTypes.end)) {
						json.worlds[worldKey].renderTypes.end.smoothLighting = renderTypes.end.smoothLighting;
						changed = true;
					}
					if (('updateMode' in renderTypes.end)) {
						json.worlds[worldKey].renderTypes.end.updateMode = renderTypes.end.updateMode;
						changed = true;
					}
				}
			}
		}
		if (changed)
			saveJSON(tempJSON);
	});
}

const { ipcMain } = require('electron');
ipcMain.on('loadWorldSettings', (event, worldKey) => {
	readSetting(function (json) {
		event.sender.send('gotWorldSettings', worldKey, json);
	}, 'worlds', worldKey);
});

let pyConfigFileQueue = [];
function processPyConfigFileQueue() {
	let timestamp = pyConfigFileQueue.shift();

	fs.writeFile(app.getPath('userData').replace(/\\/g, "/") + '/config.py', createPyConfigFile(permJson, timestamp), (err) => {
		if (err) throw err;

		if (pyConfigFileQueue.length > 0)
			processPyConfigFileQueue();
	});
}
function savePyConfigFile() {
	pyConfigFileQueue.push(new Date());
	if (pyConfigFileQueue.length > 0)
		processPyConfigFileQueue();
}

function createPyConfigFile(json, timestamp) {
	let overviewerConfigFile = '# Created on ' + timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString() + ' with Overviewer Config v' + require('../package.json').version + '\n';

	// Create worlds disctionary
	Object.values(json.worlds).forEach(function (worldInfo) {
		if (worldInfo.enabled)
			overviewerConfigFile += 'worlds["' + worldInfo.name + '"] = "' + worldInfo.path + '"\n';
	});

	overviewerConfigFile += '\n';

	// General Config
	overviewerConfigFile += 'outputdir = "' + json.global.outputLocation + '"\n';
	//overviewerConfigFile += 'customwebassets = "../web_assets"\n';
	overviewerConfigFile += 'bgcolor = "#000000"\n';
	overviewerConfigFile += 'end_lighting = [Base(), EdgeLines(), Lighting(strength=0.5)]\n';
	overviewerConfigFile += 'end_smooth_lighting = [Base(), EdgeLines(), SmoothLighting(strength=0.5)]\n';
	overviewerConfigFile += 'lighter_nether_lighting = [Base(), EdgeLines(), Nether(), Lighting(strength=0.5)]\n';
	overviewerConfigFile += 'lighter_nether_smooth_lighting = [Base(), EdgeLines(), Nether(), SmoothLighting(strength=0.5)]\n';

	if (json.global.caveDepthShading) {
		overviewerConfigFile += 'cave_custom = "cave"\n';
	} else {
		overviewerConfigFile += 'cave_custom = [Base(), EdgeLines(), Cave()]\n';
	}

	overviewerConfigFile += '\n';

	// Progress
	if (json.global.renderProgress.local && json.global.renderProgress.web) {
		overviewerConfigFile += 'from observer import MultiplexingObserver, LoggingObserver, JSObserver\n';
		overviewerConfigFile += 'observer = MultiplexingObserver(LoggingObserver(), JSObserver(outputdir, 10))\n';
		overviewerConfigFile += '\n';
	} else if (json.global.renderProgress.web) {
		overviewerConfigFile += 'from observer import JSObserver\n';
		overviewerConfigFile += 'observer = JSObserver(outputdir, 10)\n';
		overviewerConfigFile += '\n';
	} else if (json.global.renderProgress.local) {
		overviewerConfigFile += 'from observer import LoggingObserver\n';
		overviewerConfigFile += 'observer = LoggingObserver()\n';
		overviewerConfigFile += '\n';
	}

	if (json.global.compressLevel > 0) {
		overviewerConfigFile += 'from optimizeimages import oxipng\n';
		overviewerConfigFile += 'optimizeimg = [oxipng(olevel=' + json.global.compressLevel + ')]\n';
		overviewerConfigFile += '\n';
	}

	// Markers
	overviewerConfigFile += 'def signIcons(poi):\n';
	overviewerConfigFile += '\t\tif poi["id"] == "Sign" or poi["id"] == "minecraft:sign":\n';
	overviewerConfigFile += '\t\t\treturn "\\n".join([poi["Text1"], poi["Text2"], poi["Text3"], poi["Text4"]])\n';

	overviewerConfigFile += '\n';

	overviewerConfigFile += 'def caveSignIcons(poi):\n';
	overviewerConfigFile += '\tif poi["id"] == "Sign" or poi["id"] == "minecraft:sign":\n';
	overviewerConfigFile += '\t\tif poi["z"] <= 128:\n';
	overviewerConfigFile += '\t\t\treturn "\\n".join([poi["Text1"], poi["Text2"], poi["Text3"], poi["Text4"]])\n';

	overviewerConfigFile += '\n';

	overviewerConfigFile += 'def chestIcons(poi):\n';
	overviewerConfigFile += '\tif poi["id"] == "Chest":\n';
	overviewerConfigFile += '\t\tif not "Items" in poi:\n';
	overviewerConfigFile += '\t\t\treturn "Chest with items"\n';
	overviewerConfigFile += '\t\telse:\n';
	overviewerConfigFile += '\t\t\treturn "Chest with %d items" % len(poi["Items"])\n';

	overviewerConfigFile += '\n';

	overviewerConfigFile += 'def caveChestIcons(poi):\n';
	overviewerConfigFile += '\tif poi["id"] == "Chest":\n';
	overviewerConfigFile += '\t\tif poi["z"] <= 128:\n';
	overviewerConfigFile += '\t\t\tif not "Items" in poi:\n';
	overviewerConfigFile += '\t\t\t\treturn "Chest with items"\n';
	overviewerConfigFile += '\t\t\telse:\n';
	overviewerConfigFile += '\t\t\t\treturn "Chest with %d items" % len(poi["Items"])\n';

	overviewerConfigFile += '\n';

	overviewerConfigFile += 'def playerIcons(poi):\n';
	overviewerConfigFile += '\tif poi["id"] == "Player":\n';
	overviewerConfigFile += '\t\tpoi["icon"] = "https://overviewer.org/avatar/%s" % poi["EntityId"]\n';
	overviewerConfigFile += '\t\treturn "Last known location for %s" % poi["EntityId"]\n';

	overviewerConfigFile += '\n';

	overviewerConfigFile += 'def cavePlayerIcons(poi):\n';
	overviewerConfigFile += '\tif poi["id"] == "Player":\n';
	overviewerConfigFile += '\t\tif poi["z"] <= 128:\n';
	overviewerConfigFile += '\t\t\tpoi["icon"] = "https://overviewer.org/avatar/%s" % poi["EntityId"]\n';
	overviewerConfigFile += '\t\t\treturn "Last known location for %s" % poi["EntityId"]\n';

	overviewerConfigFile += '\n';

	overviewerConfigFile += 'signFilter = dict(name="Signs", filterFunction=signIcons)\n';
	overviewerConfigFile += 'caveSignFilter = dict(name="Signs", filterFunction=caveSignIcons)\n';
	overviewerConfigFile += 'chestFilter = dict(name="Chests", filterFunction=chestIcons, icon="chest.png", createInfoWindow=True)\n';
	overviewerConfigFile += 'caveChestFilter = dict(name="Chests", filterFunction=caveChestIcons, icon="chest.png", createInfoWindow=True)\n';
	overviewerConfigFile += 'playerFilter = dict(name="Players", filterFunction=playerIcons, checked=True)\n';
	overviewerConfigFile += 'cavePlayerFilter = dict(name="Players", filterFunction=cavePlayerIcons, checked=True)\n';

	overviewerConfigFile += '\n';

	overviewerConfigFile += 'regularMarkers = [signFilter, chestFilter, playerFilter]\n';
	overviewerConfigFile += 'caveMarkers = [caveSignFilter, caveChestFilter, cavePlayerFilter]\n';
	overviewerConfigFile += 'netherMarkers = regularMarkers\n';
	overviewerConfigFile += 'endMarkers = regularMarkers\n';

	// World Config Setup
	Object.values(json.worlds).forEach(function (worldInfo, worldIndex) {
		if (worldInfo.enabled) {
			overviewerConfigFile += '\n';
			overviewerConfigFile += '###\t' + worldInfo.name + '\n';

			if (worldInfo.renderTypes.day.enabled) {
				overviewerConfigFile += '##\tDay\n';
				if (worldInfo.directions.ul)
					renderDirection("ul", worldInfo);
				if (worldInfo.directions.ur)
					renderDirection("ur", worldInfo);
				if (worldInfo.directions.lr)
					renderDirection("lr", worldInfo);
				if (worldInfo.directions.ll)
					renderDirection("ll", worldInfo);

				function renderDirection(direction) {
					overviewerConfigFile += 'renders["' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-day"] = {\n';
					switch (direction) {
						case "ur":
							overviewerConfigFile += '#\tUpper Right\n';
							overviewerConfigFile += '\t"northdirection": "upper-right",\n';
							break;
						case "ll":
							overviewerConfigFile += '#\tLower Left\n';
							overviewerConfigFile += '\t"northdirection": "lower-left",\n';
							break;
						case "lr":
							overviewerConfigFile += '#\tLower Right\n';
							overviewerConfigFile += '\t"northdirection": "lower-right",\n';
							break;
						default:
							overviewerConfigFile += '#\tUpper Left\n';
							overviewerConfigFile += '\t"northdirection": "upper-left",\n';
							break;
					}
					overviewerConfigFile += '\t"world": "' + worldInfo.name + '",\n';
					overviewerConfigFile += '\t"title": "Day",\n';
					if (worldInfo.renderTypes.day.smoothLighting) {
						overviewerConfigFile += '\t"rendermode": "smooth_lighting",\n';
					} else {
						overviewerConfigFile += '\t"rendermode": "lighting",\n';
					}
					overviewerConfigFile += '\t"markers": regularMarkers,\n';
					overviewerConfigFile += '\t"renderchecks": ' + worldInfo.renderTypes.day.updateMode + ',\n';
					overviewerConfigFile += '}\n';
				}
			}

			if (worldInfo.renderTypes.caves.enabled) {
				overviewerConfigFile += '##\tCaves\n';
				if (worldInfo.directions.ul)
					renderDirection("ul", worldInfo);
				if (worldInfo.directions.ur)
					renderDirection("ur", worldInfo);
				if (worldInfo.directions.lr)
					renderDirection("lr", worldInfo);
				if (worldInfo.directions.ll)
					renderDirection("ll", worldInfo);

				function renderDirection(direction) {
					overviewerConfigFile += 'renders["' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-caves"] = {\n';
					switch (direction) {
						case "ur":
							overviewerConfigFile += '#\tUpper Right\n';
							overviewerConfigFile += '\t"northdirection": "upper-right",\n';
							break;
						case "ll":
							overviewerConfigFile += '#\tLower Left\n';
							overviewerConfigFile += '\t"northdirection": "lower-left",\n';
							break;
						case "lr":
							overviewerConfigFile += '#\tLower Right\n';
							overviewerConfigFile += '\t"northdirection": "lower-right",\n';
							break;
						default:
							overviewerConfigFile += '#\tUpper Left\n';
							overviewerConfigFile += '\t"northdirection": "upper-left",\n';
							break;
					}
					overviewerConfigFile += '\t"world": "' + worldInfo.name + '",\n';
					overviewerConfigFile += '\t"title": "Caves",\n';
					overviewerConfigFile += '\t"rendermode": cave_custom,\n';
					overviewerConfigFile += '\t"markers": caveMarkers,\n';
					overviewerConfigFile += '\t"renderchecks": ' + worldInfo.renderTypes.caves.updateMode + ',\n';
					overviewerConfigFile += '}\n';
				}
			}

			if (worldInfo.renderTypes.night.enabled) {
				overviewerConfigFile += '##\tNight\n';
				if (worldInfo.directions.ul)
					renderDirection("ul", worldInfo);
				if (worldInfo.directions.ur)
					renderDirection("ur", worldInfo);
				if (worldInfo.directions.lr)
					renderDirection("lr", worldInfo);
				if (worldInfo.directions.ll)
					renderDirection("ll", worldInfo);

				function renderDirection(direction) {
					overviewerConfigFile += 'renders["' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-night"] = {\n';
					switch (direction) {
						case "ur":
							overviewerConfigFile += '#\tUpper Right\n';
							overviewerConfigFile += '\t"northdirection": "upper-right",\n';
							break;
						case "ll":
							overviewerConfigFile += '#\tLower Left\n';
							overviewerConfigFile += '\t"northdirection": "lower-left",\n';
							break;
						case "lr":
							overviewerConfigFile += '#\tLower Right\n';
							overviewerConfigFile += '\t"northdirection": "lower-right",\n';
							break;
						default:
							overviewerConfigFile += '#\tUpper Left\n';
							overviewerConfigFile += '\t"northdirection": "upper-left",\n';
							break;
					}
					overviewerConfigFile += '\t"world": "' + worldInfo.name + '",\n';
					overviewerConfigFile += '\t"title": "Night",\n';
					if (worldInfo.renderTypes.night.smoothLighting) {
						overviewerConfigFile += '\t"rendermode": "smooth_night",\n';
					} else {
						overviewerConfigFile += '\t"rendermode": "night",\n';
					}
					overviewerConfigFile += '\t"markers": regularMarkers,\n';
					overviewerConfigFile += '\t"renderchecks": ' + worldInfo.renderTypes.night.updateMode + ',\n';
					overviewerConfigFile += '}\n';
				}
			}

			if (worldInfo.renderTypes.minerals.enabled || worldInfo.renderTypes.spawn.enabled) overviewerConfigFile += '###\tOverlays\n';

			if (worldInfo.renderTypes.minerals.enabled) {
				overviewerConfigFile += '##\tMinerals\n';
				if (worldInfo.directions.ul)
					renderDirection("ul", worldInfo);
				if (worldInfo.directions.ur)
					renderDirection("ur", worldInfo);
				if (worldInfo.directions.lr)
					renderDirection("lr", worldInfo);
				if (worldInfo.directions.ll)
					renderDirection("ll", worldInfo);

				function renderDirection(direction) {
					overviewerConfigFile += 'renders["' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-minerals"] = {\n';
					switch (direction) {
						case "ur":
							overviewerConfigFile += '#\tUpper Right\n';
							overviewerConfigFile += '\t"northdirection": "upper-right",\n';
							break;
						case "ll":
							overviewerConfigFile += '#\tLower Left\n';
							overviewerConfigFile += '\t"northdirection": "lower-left",\n';
							break;
						case "lr":
							overviewerConfigFile += '#\tLower Right\n';
							overviewerConfigFile += '\t"northdirection": "lower-right",\n';
							break;
						default:
							overviewerConfigFile += '#\tUpper Left\n';
							overviewerConfigFile += '\t"northdirection": "upper-left",\n';
							break;
					}
					overviewerConfigFile += '\t"world": "' + worldInfo.name + '",\n';
					overviewerConfigFile += '\t"title": "Minerals",\n';
					overviewerConfigFile += '\t"rendermode": [ClearBase(), MineralOverlay()],\n';
					var overlay = '[';
					if (worldInfo.renderTypes.day.enabled) overlay += '"' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-day",';
					if (worldInfo.renderTypes.caves.enabled) overlay += '"' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-caves",';
					if (worldInfo.renderTypes.night.enabled) overlay += '"' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-night",';
					overviewerConfigFile += '\t"overlay": ' + overlay.substring(0, overlay.length - 1) + '],\n';
					overviewerConfigFile += '\t"renderchecks": ' + worldInfo.renderTypes.minerals.updateMode + ',\n';
					overviewerConfigFile += '}\n';
				}
			}

			if (worldInfo.renderTypes.spawn.enabled) {
				overviewerConfigFile += '##\tMob Spawn\n';
				if (worldInfo.directions.ul)
					renderDirection("ul", worldInfo);
				if (worldInfo.directions.ur)
					renderDirection("ur", worldInfo);
				if (worldInfo.directions.lr)
					renderDirection("lr", worldInfo);
				if (worldInfo.directions.ll)
					renderDirection("ll", worldInfo);

				function renderDirection(direction) {
					overviewerConfigFile += 'renders["' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-spawn"] = {\n';
					switch (direction) {
						case "ur":
							overviewerConfigFile += '#\tUpper Right\n';
							overviewerConfigFile += '\t"northdirection": "upper-right",\n';
							break;
						case "ll":
							overviewerConfigFile += '#\tLower Left\n';
							overviewerConfigFile += '\t"northdirection": "lower-left",\n';
							break;
						case "lr":
							overviewerConfigFile += '#\tLower Right\n';
							overviewerConfigFile += '\t"northdirection": "lower-right",\n';
							break;
						default:
							overviewerConfigFile += '#\tUpper Left\n';
							overviewerConfigFile += '\t"northdirection": "upper-left",\n';
							break;
					}
					overviewerConfigFile += '\t"world": "' + worldInfo.name + '",\n';
					overviewerConfigFile += '\t"title": "Mob Spawn",\n';
					overviewerConfigFile += '\t"rendermode": [ClearBase(), SpawnOverlay()],\n';
					var overlay = '[';
					if (worldInfo.renderTypes.day.enabled) overlay += '"' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-day",';
					if (worldInfo.renderTypes.caves.enabled) overlay += '"' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-caves",';
					if (worldInfo.renderTypes.night.enabled) overlay += '"' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-night",';
					overviewerConfigFile += '\t"overlay": ' + overlay.substring(0, overlay.length - 1) + '],\n';
					overviewerConfigFile += '\t"renderchecks": ' + worldInfo.renderTypes.spawn.updateMode + ',\n';
					overviewerConfigFile += '}\n';
				}
			}

			if (worldInfo.renderTypes.nether.enabled) {
				overviewerConfigFile += '##\tNether\n';
				if (worldInfo.directions.ul)
					renderDirection("ul", worldInfo);
				if (worldInfo.directions.ur)
					renderDirection("ur", worldInfo);
				if (worldInfo.directions.lr)
					renderDirection("lr", worldInfo);
				if (worldInfo.directions.ll)
					renderDirection("ll", worldInfo);

				function renderDirection(direction) {
					overviewerConfigFile += 'renders["' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-nether"] = {\n';
					switch (direction) {
						case "ur":
							overviewerConfigFile += '#\tUpper Right\n';
							overviewerConfigFile += '\t"northdirection": "upper-right",\n';
							break;
						case "ll":
							overviewerConfigFile += '#\tLower Left\n';
							overviewerConfigFile += '\t"northdirection": "lower-left",\n';
							break;
						case "lr":
							overviewerConfigFile += '#\tLower Right\n';
							overviewerConfigFile += '\t"northdirection": "lower-right",\n';
							break;
						default:
							overviewerConfigFile += '#\tUpper Left\n';
							overviewerConfigFile += '\t"northdirection": "upper-left",\n';
							break;
					}
					overviewerConfigFile += '\t"world": "' + worldInfo.name + '",\n';
					overviewerConfigFile += '\t"title": "Nether",\n';
					overviewerConfigFile += '\t"dimension": "nether",\n';
					if (worldInfo.renderTypes.nether.smoothLighting) {
						overviewerConfigFile += '\t"rendermode": lighter_nether_smooth_lighting,\n';
					} else {
						overviewerConfigFile += '\t"rendermode": lighter_nether_lighting,\n';
					}
					overviewerConfigFile += '\t"markers": netherMarkers,\n';
					overviewerConfigFile += '\t"renderchecks": ' + worldInfo.renderTypes.nether.updateMode + ',\n';
					overviewerConfigFile += '}\n';
				}
			}

			if (worldInfo.renderTypes.end.enabled) {
				overviewerConfigFile += '##\tEnd\n';
				if (worldInfo.directions.ul)
					renderDirection("ul", worldInfo);
				if (worldInfo.directions.ur)
					renderDirection("ur", worldInfo);
				if (worldInfo.directions.lr)
					renderDirection("lr", worldInfo);
				if (worldInfo.directions.ll)
					renderDirection("ll", worldInfo);

				function renderDirection(direction) {
					overviewerConfigFile += 'renders["' + Object.keys(json.worlds)[worldIndex] + '-' + direction + '-end"] = {\n';
					switch (direction) {
						case "ur":
							overviewerConfigFile += '#\tUpper Right\n';
							overviewerConfigFile += '\t"northdirection": "upper-right",\n';
							break;
						case "ll":
							overviewerConfigFile += '#\tLower Left\n';
							overviewerConfigFile += '\t"northdirection": "lower-left",\n';
							break;
						case "lr":
							overviewerConfigFile += '#\tLower Right\n';
							overviewerConfigFile += '\t"northdirection": "lower-right",\n';
							break;
						default:
							overviewerConfigFile += '#\tUpper Left\n';
							overviewerConfigFile += '\t"northdirection": "upper-left",\n';
							break;
					}
					overviewerConfigFile += '\t"world": "' + worldInfo.name + '",\n';
					overviewerConfigFile += '\t"title": "End",\n';
					overviewerConfigFile += '\t"dimension": "end",\n';
					if (worldInfo.renderTypes.end.smoothLighting) {
						overviewerConfigFile += '\t"rendermode": end_smooth_lighting,\n';
					} else {
						overviewerConfigFile += '\t"rendermode": end_lighting,\n';
					}
					overviewerConfigFile += '\t"markers": endMarkers,\n';
					overviewerConfigFile += '\t"renderchecks": ' + worldInfo.renderTypes.end.updateMode + ',\n';
					overviewerConfigFile += '}\n';
				}
			}
		}
	});

	return overviewerConfigFile;
}