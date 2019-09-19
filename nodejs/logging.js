'use strict';

const electron = require('./electronSetup.js');
const cleanDate = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s+)\S+.+/;

module.exports.messageLog = function (message, showOnUi = true) {
	if (showOnUi) {
		if (cleanDate.test(message)) {
			electron.mainWindow.webContents.send('visualLog', cleanDate.exec(message));
		} else {
			electron.mainWindow.webContents.send('visualLog', message);
		}
	}
	console.log(message);
}