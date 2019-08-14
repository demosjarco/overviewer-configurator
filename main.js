'use strict';

const { ipcMain } = require('electron');

const runOverviewer = require('./nodejs/runOverviewer.js');
ipcMain.on('runOverviewer', (event, runType) => {
	switch (runType) {
		case 'map':
			runOverviewer.renderMap();
			break;
		case 'poi':
			runOverviewer.renderPoi();
			break;
		case 'webass':
			runOverviewer.renderWebAssets();
			break;
	}
});
ipcMain.on('stopOverviewer', (event, runType) => {
	switch (runType) {
		case 'map':
			runOverviewer.stopRenderMap();
			break;
		case 'poi':
			runOverviewer.stopRenderPoi();
			break;
		case 'webass':
			runOverviewer.stopRenderWebAssets();
			break;
	}
});

const config = require('./nodejs/configFile.js');
ipcMain.on('readOldSettings', (event, arg) => {
	config.readOldSettings();
});
ipcMain.on('changedSetting', (event, optionValue, settingType, optionKey1, optionKey2, optionKey3) => {
	config.changedSetting(optionValue, settingType, optionKey1, optionKey2, optionKey3);
});
ipcMain.on('outputFolderSelection', (event, arg) => {
	config.outputFolderSelection();
});

const worldManagement = require('./nodejs/worldManagement.js');
ipcMain.on('worldsFolderSelection', (event, arg) => {
	worldManagement.worldsFolderSelection();
});