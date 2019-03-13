const { app } = require('electron');
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
			if (!('global' in json)) {
				tempJson.global = {
					caveDepthShading: true,
					compressLevel: 2,
					renderProgress: {
						local: true,
						web: false
					},
					worldsLocation: null
				};
			} else {
				if (!('caveDepthShading' in json.global)) {
					json.global.caveDepthShading = true;
				}
				if (!('compressLevel' in json.global)) {
					json.global.compressLevel = 2;
				}
				if (!('renderProgress' in json.global)) {
					json.global.renderProgress = {
						local: true,
						web: false
					};
				} else {
					if (!('local' in json.global.renderProgress)) {
						json.global.renderProgress.local = true;
					}
					if (!('web' in json.global.renderProgress)) {
						json.global.renderProgress.web = true;
					}
				}
				if (!('worldsLocation' in json.global)) {
					json.global.worldsLocation = null;
				}
			}

			if (!('worlds' in json)) {
				tempJson.worlds = [];
			}

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

const electron = require('./electronSetup.js');
module.exports.readOldSettings = function () {
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