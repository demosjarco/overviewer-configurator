'use strict';

const { app } = require('electron');
const fs = require('fs');

let runningJson = {};

module.exports = class SettingsManager {
	constructor() {

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
		fs.readFile(settingsPath, (err, data) => {
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
				compressLevel: 0,
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
				tempJson.global.compressLevel = 0;
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