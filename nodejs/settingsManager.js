'use strict';

const { app } = require('electron');
const fs = require('fs');

let runningJson = {};

module.exports = class SettingsManager {
	constructor() {
		getSavedJSON(null);
	}

	getJson(jsonCallback) {
		getSavedJSON(jsonCallback);
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