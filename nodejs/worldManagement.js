const { ipcMain, dialog } = require('electron');
const config = require('./configFile.js');
const electron = require('./electronSetup.js');

module.exports.worldsFolderSelection = function () {
	dialog.showOpenDialog({
		title: 'test',
		message: 'test2',
		properties: ['openDirectory']
	}, function (filePaths, bookmarks) {
		if (filePaths.length > 0) {
			let path = filePaths[0].replace(/\\/g, "/");
			config.changedSetting(path, 'global', 'worldsLocation');
			electron.mainWindow.webContents.send('readSetting_global_worldsLocation', path);
		}
	});
}

const fs = require('fs');
ipcMain.on('readWorlds', (event, arg) => {
	config.getWorldLocationPath(function (worldsPath) {
		if (worldsPath != null) {
			event.sender.send('clearWorlds');
			fs.readdir(worldsPath, { withFileTypes: true }, (err1, files1) => {
				if (err1) throw err1;
				let file1counter = 0;
				function file1loop(file1) {
					if (file1.isFile() && file1.name == 'level.dat') {
						foundWorld(worldsPath.split('/').pop(), worldsPath);
						nextLevel1();
					} else if (file1.isDirectory()) {
						// Level 2
						fs.readdir(worldsPath + '/' + file1.name, { withFileTypes: true }, (err2, files2) => {
							if (err2) throw err2;
							if (files2.length > 0) {
								let file2counter = 0;
								function file2loop(file2) {
									if (file2.isFile() && file2.name == 'level.dat') {
										foundWorld(worldsPath.split('/').pop(), worldsPath + '/' + file1.name);
										nextLevel2();
									} else if (file2.isDirectory()) {
										// Go level 3
										fs.readdir(worldsPath + '/' + file1.name + '/' + file2.name, { withFileTypes: true }, (err3, files3) => {
											if (err3) throw err3;
											if (files3.length > 0) {
												let file3counter = 0;
												function file3loop(file3) {
													if (file3.isFile() && file3.name == 'level.dat') {
														foundWorld((worldsPath + '/' + file1.name).split('/').pop(), worldsPath + '/' + file1.name + '/' + file2.name)
													}

													nextLevel3();

													function nextLevel3() {
														file3counter++;
														if (file3counter < files3.length) {
															file3loop(files3[file3counter]);
														} else {
															nextLevel2();
														}
													}
												}
												file3loop(files3[file3counter]);
											} else {
												nextLevel2();
											}
										});
									} else {
										nextLevel2();
									}

									function nextLevel2() {
										file2counter++;
										if (file2counter < files2.length) {
											file2loop(files2[file2counter]);
										} else {
											nextLevel1();
										}
									}
								}
								file2loop(files2[file2counter]);
							} else {
								nextLevel1();
							}
						});
					} else {
						nextLevel1();
					}

					function nextLevel1() {
						file1counter++;
						if (file1counter < files1.length) {
							file1loop(files1[file1counter]);
						}
					}
				}
				file1loop(files1[file1counter]);
			});

			function foundWorld(worldName, worldPath) {
				function worldNickName(worldName) {
					var nickname = "";
					worldName.split(" ").forEach(function (namePart) {
						nickname += namePart.charAt(namePart.search(/[0-9a-z]/i)).toLowerCase();
					});
					return nickname;
				}

				config.updateWorldConfig(worldNickName(worldName), worldName, worldPath);
				event.sender.send('gotWorld', worldNickName(worldName), worldName, worldPath);
			}
		}
	});
});

ipcMain.on('updateWorldInfo', (event, worldKey, worldDirections, worldEnabled) => {
	config.updateWorldConfig(worldKey, null, null, worldDirections, worldEnabled);
});