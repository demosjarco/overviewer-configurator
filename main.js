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
ipcMain.on('changedSetting', (event, settingType, optionValue, optionKey1, optionKey2, optionKey3) => {
	config.changedSetting(settingType, optionValue, optionKey1, optionKey2, optionKey3);
});