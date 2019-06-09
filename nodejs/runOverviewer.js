'use strict';

const { app } = require('electron');
const electron = require('./electronSetup.js');
const fs = require('fs');
const spawn = require('child_process').spawn;
const logging = require('./logging.js');
let mapRenderer;
let poiRenderer;
let webassRenderer;

function getOverviewerPaths(callback) {
	fs.readdir(app.getPath('userData'), function (err, files) {
		if (err) throw err;

		files.forEach(function (fileName) {
			const overviewerFolderReg = /(?<=overviewer-)\d+\.\d+\.\d+(?!.zip)$/;
			if (overviewerFolderReg.test(fileName)) {
				fs.readdir(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/', function (err1, files1) {
					files1.forEach(function (fileName1) {
						const overviewerExecutableReg = /overviewer\.(exe|py)+$/;
						if (overviewerExecutableReg.test(fileName1)) {
							callback(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/' + fileName1, app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/');
						}
					});
				});
			}
		});
	});
}

module.exports.renderMap = function () {
	getOverviewerPaths(function (exec, wd) {
		mapRenderer = spawn(exec, ['--config=../config.py'], {
			cwd: wd,
			windowsHide: true
		});
		electron.mainWindow.webContents.send('overviewerRunProgress', 'map');
		mapRenderer.stdout.setEncoding('utf8');
		const progressTest = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+\s\w+\s\d+/;
		const progressCurrent = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+/;
		const progressMax = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s\d+\s\w+\s)\d+/;
		mapRenderer.stdout.on('data', function (data) {
			if (progressTest.test(data)) {
				electron.mainWindow.webContents.send('overviewerRunProgress', 'map', progressMax.exec(data), progressCurrent.exec(data));
			}
			logging.messageLog(data);
		});
		mapRenderer.stderr.on('data', function (data) {
			logging.messageLog(data);
		});
		mapRenderer.on('close', function (exitCode) {
			logging.messageLog('Closed with code ' + code);
		});
	});
};

module.exports.renderPoi = function () {

};

module.exports.renderWebAssets = function () {

};

module.exports.stopRenderMap = function () {
	mapRenderer.kill();
	electron.mainWindow.webContents.send('overviewerRunProgress', 'map', '1', '1');
};

module.exports.stopRenderPoi = function () {

};

module.exports.stopRenderWebAssets = function () {

};