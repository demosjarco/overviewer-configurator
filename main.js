'use strict';

const { ipcMain } = require('electron');

const runOverviewer = require('./nodejs/runOverviewer.js');
ipcMain.on('runOverviewer', (event, runType) => {
	switch (runType) {
		case 0:
			runOverviewer.renderMap();
			return;
		case 1:
			runOverviewer.renderPoi();
			return;
		case 2:
			runOverviewer.renderWebAssets();
			return;
	}
});

const overviewerVersions = require('./nodejs/overviewerVersions.js');
ipcMain.on('getOverviewerVersion', (event, arg) => {
	overviewerVersions.updateLocalOverviewerVersion(function (currentVersion) {
		event.sender.send('gotOverviewerVersion', currentVersion);
	});
});

ipcMain.on('getLatestOverviewerVersion', (event, arg) => {
	overviewerVersions.updateOverviewerVersions(function (latestVersion) {
		event.sender.send('gotLatestOverviewerVersion', latestVersion);
	});
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