const { ipcMain, dialog } = require('electron');
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

function worldNickName(worldName) {
	var nickname = "";
	worldName.split(" ").forEach(function (namePart) {
		nickname += namePart.charAt(namePart.search(/[0-9a-z]/i)).toLowerCase();
	});
	return nickname;
}

const fs = require('fs');

function getDirectoriesFromDir(path, error, folders) {
	let folderList = [];
	fs.readdir(path, { withFileTypes: true }, (err, files) => {
		if (err)
			error(err);
		if (files) {
			files.forEach(function (item) {
				if (item.isDirectory())
					folderList.push(item.name);
			});
			folders(folderList);
		}
	});
}

ipcMain.on('readWorlds', (event, arg) => {
	config.getWorldLocationPath(function (worldsPath) {
		if (worldsPath != null) {

		}
	});
});