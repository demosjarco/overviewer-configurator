'use strict';

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

// https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
// https://qwtel.com/posts/software/async-generators-in-the-wild/