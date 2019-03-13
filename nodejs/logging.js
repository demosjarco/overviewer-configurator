const electron = require('./electronSetup.js');

module.exports.messageLog = function (message, showOnUi = true) {
	if (showOnUi)
		electron.mainWindow.webContents.send('visualLog', message);
	console.log(message);
}