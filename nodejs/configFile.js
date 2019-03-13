const { app } = require('electron');
const fs = require('fs');

function getSavedJSON(jsonCallback) {
	fs.readFile(app.getPath('userData').replace(/\\/g, "/") + '/settings.json', (err, data) => {
		if (err) {
			let newSettings = {
				global: {
					renderProgress: {
						local: true,
						web: false
					}
				},
				worlds: []
			};
			fs.writeFile(app.getPath('userData').replace(/\\/g, "/") + '/settings.json', JSON.stringify(newSettings, null, 4), (err) => {
				if (err) throw err;
			});
			if (jsonCallback)
				jsonCallback(newSettings);
		} else {
			if (jsonCallback)
				jsonCallback(JSON.parse(data));
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
}