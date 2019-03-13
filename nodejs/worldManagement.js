const { dialog } = require('electron');
const config = require('./configFile.js');
const electron = require('./electronSetup.js');

module.exports.worldsFolderSelection = function () {
	dialog.showOpenDialog({
		title: 'test',
		message: 'test2',
		properties: ['openDirectory']
	}, function (filePaths, bookmarks) {
		let path = filePaths[0].replace(/\\/g, "/");
		config.changedSetting(path, 'global', 'worldsLocation');
		electron.mainWindow.webContents.send('readSetting_global_worldsLocation', path);
	});
}