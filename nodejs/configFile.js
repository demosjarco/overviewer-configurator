const { app, dialog } = require('electron');
const fs = require('fs');

function getSavedJSON(jsonCallback) {
	fs.readFile(app.getPath('userData').replace(/\\/g, "/") + '/settings.json', (err, data) => {
		if (err) {
			updatePreferencesFileIfNeeded(function (json) {
				if (jsonCallback)
					jsonCallback(json);
			});
		} else {
			updatePreferencesFileIfNeeded(function (json) {
				if (jsonCallback)
					jsonCallback(json);
			}, JSON.parse(data));
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
				tempJson.worlds = [];
			}

			if (changed)
				fs.writeFile(app.getPath('userData').replace(/\\/g, "/") + '/settings.json', JSON.stringify(tempJson, null, 4), (err) => {
					if (err) throw err;
				});
			if (finishedCallback)
				finishedCallback(tempJson);
		}
	});
}
// First time setup
getSavedJSON();

function saveJSON(updatedJSON) {
	fs.writeFile(app.getPath('userData').replace(/\\/g, "/") + '/settings.json', JSON.stringify(updatedJSON, null, 4), (err) => {
		if (err) throw err;
	});
}

module.exports.changedSetting = function (optionValue, settingType, optionKey1, optionKey2, optionKey3) {
	getSavedJSON(function (json) {
		let tempJSON = json;
		if (optionKey1 && optionKey2 && optionKey3) {
			tempJSON[settingType][optionKey1][optionKey2][optionKey3] = optionValue;
		} else if (optionKey1 && optionKey2) {
			tempJSON[settingType][optionKey1][optionKey2] = optionValue;
		} else if (optionKey1) {
			tempJSON[settingType][optionKey1] = optionValue;
		}
		saveJSON(tempJSON);
	});
}

function readSetting(settingCallback, settingType, optionKey1, optionKey2, optionKey3) {
	getSavedJSON(function (json) {
		if (optionKey1 && optionKey2 && optionKey3) {
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
		title: 'test',
		message: 'test2',
		properties: ['openDirectory']
	}, function (filePaths, bookmarks) {
		if (filePaths.length > 0) {
			let path = filePaths[0].replace(/\\/g, "/");
			module.exports.changedSetting(path, 'global', 'outputLocation');
			electron.mainWindow.webContents.send('readSetting_global_outputLocation', path);
		}
	});
}