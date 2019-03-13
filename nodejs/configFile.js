const { app } = require('electron');
const fs = require('fs');

function getSavedJSON(jsonCallback) {
	fs.readFile(app.getPath('userData').replace(/\\/g, "/") + '/settings.json', (err, data) => {
		if (err || true) {
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

module.exports.changedGlobalConfigOption = function (optionValue, optionKey1, optionKey2) {
	getSavedJSON(function (json) {
		let tempJSON = json;
		if (optionKey1 && optionKey2) {
			tempJSON.global[optionKey1][optionKey2] = optionValue;
		} else if (optionKey1) {
			tempJSON.global[optionKey1] = optionValue;
		}
		saveJSON(tempJSON);
	});
}