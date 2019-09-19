'use strict';

const { ipcMain } = require('electron');
require('./nodejs/runOverviewer.js');

const electron = require('./nodejs/electronSetup.js');

ipcMain.on('getWorldsLocation', (event) => {
	electron.settingsManager.getJson(function (json) {
		event.sender.send('gotWorldsLocation', json.global.worldsLocation);
	});
});
ipcMain.on('updateWorldsLocation', (event, path) => {
	electron.settingsManager.updateWorldsPath(path);
});
ipcMain.on('getMapsLocation', (event) => {
	electron.settingsManager.getJson(function (json) {
		event.sender.send('gotMapsLocation', json.global.outputLocation);
	});
});
ipcMain.on('updateMapsLocation', (event, path) => {
	electron.settingsManager.updateMapsPath(path);
});