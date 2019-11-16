const { ipcMain, dialog } = require('electron');
const electron = require('./electronSetup.js');
const config = require('./configFile.js');
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

});

(async () => {
	for await (const f of getFiles('.')) {
		console.log(f);
	}
})()