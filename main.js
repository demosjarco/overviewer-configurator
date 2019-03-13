'use strict';

const {ipcMain} = require('electron');

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
ipcMain.on('changedGlobalConfigOption', (event, optionValue, optionKey1, optionKey2) => {
	config.changedGlobalConfigOption(optionValue, optionKey1, optionKey2);
});