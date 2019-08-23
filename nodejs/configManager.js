'use strict';

const { app } = require('electron');
const fs = require('fs');

const configPath = app.getPath('userData').replace(/\\/g, "/") + '/config.py';
let saveQueue = [];
let saveQueueProcessing = false;

module.exports = class ConfigManager {
	constructor() {

	}

	updateConfig(json) {
		saveQueue.push({ timestamp: new Date(), content: json });
		if (saveQueue.length > 0 && !saveQueueProcessing) {
			processSaveQueue();
		}
	}
}

function processSaveQueue() {
	saveQueueProcessing = true;
	let info = saveQueue.shift();
	fs.writeFile(configPath, createPyConfigFile(info.timestamp, info.content), (err) => {
		if (err) throw err;

		if (saveQueue.length > 0) {
			processSaveQueue();
		} else {
			saveQueueProcessing = false;
		}
	});
}

function createPyConfigFile(timestamp = new Date(), permJson = {}) {
	let overviewerConfigFile = '# Created on ' + timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString() + ' with Overviewer Config v' + require('../package.json').version + '\n';

	return overviewerConfigFile;
}