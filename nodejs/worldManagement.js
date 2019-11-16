'use strict';

const { ipcMain } = require('electron');
const electron = require('./electronSetup.js');
const setMan = require("./settingsManager.js");
const SettingsManager = new setMan();
const { resolve } = require('path');
const { readdir } = require('fs').promises;

async function* getFiles(dir) {
	const dirents = await readdir(dir, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = resolve(dir, dirent.name);
		if (dirent.isDirectory()) {
			yield* getFiles(res);
		} else {
			yield res;
		}
	}
}

ipcMain.on('readWorlds', (event, arg) => {
	const path = require('path');
	const levelReg = /(?=.?\/?)level\.dat$/i;
	(async () => {
		for await (const f of getFiles(SettingsManager.getWorldsLocation())) {
			if (levelReg.test(f)) {
				SettingsManager.addWorld(path.dirname(f).replace(/\\/g, "/"), (tempPath, callback) => {
					const fs = require('fs');
					const temp2 = path.resolve(tempPath, '../server.properties');
					fs.readFile(temp2, { encoding: 'utf8' }, (err, data) => {
						const serverNameReg = /(?<=motd\s?\=\w?).+(?:\n)/i;
						if (err) {
							// server.properties doesn't exist, use current folder name
							const serverName = path.basename(tempPath);
							callback(worldNickName(serverName), serverName);
						} else {
							// server.properties exists
							if (serverNameReg.test(data)) {
								// use motd
								const serverName = serverNameReg.exec(data)[0].trim();
								callback(worldNickName(serverName), serverName);
							} else {
								// motd detection failed, use parent folder name
								const serverName = path.basename(path.resolve(tempPath, '..'));
								callback(worldNickName(serverName), serverName);
							}
						}
					});
				});
			}
		}
	})();
});

function worldNickName(worldName) {
	let nickname = "";
	worldName.split(" ").forEach(function (namePart) {
		nickname += namePart.charAt(namePart.search(/[0-9a-z]/i)).toLowerCase();
	});
	return nickname;
}