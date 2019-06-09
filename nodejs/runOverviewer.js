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
		mapRenderer = spawn(exec, ['--config=../config.py', '--processes', '' + require('os').cpus().length], {
			cwd: wd,
			windowsHide: true
		});
		electron.mainWindow.webContents.send('overviewerRunProgress', 'map');
		electron.mainWindow.setProgressBar(1, { mode: 'indeterminate' });
		mapRenderer.stdout.setEncoding('utf8');
		const progressTest = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+\s\w+\s\d+/;
		const progressCurrent = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+/;
		const progressMax = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s\d+\s\w+\s)\d+/;
		mapRenderer.stdout.on('data', function (data) {
			if (progressTest.test(data)) {
				electron.mainWindow.webContents.send('overviewerRunProgress', 'map', progressMax.exec(data), progressCurrent.exec(data));
				if (parseInt(progressCurrent.exec(data)) < parseInt(progressMax.exec(data))) {
					electron.mainWindow.setProgressBar(parseFloat(progressCurrent.exec(data)) / parseFloat(progressMax.exec(data)), { mode: 'normal' });
				} else {
					electron.mainWindow.setProgressBar(1, { mode: 'none' });
				}
			}
			logging.messageLog(data);
		});
		mapRenderer.stderr.on('data', function (data) {
			logging.messageLog(data);
		});
		mapRenderer.on('close', function (exitCode) {
			logging.messageLog('Closed with code ' + exitCode);
			electron.mainWindow.webContents.send('overviewerRunProgress', 'map', '1', '1');
			electron.mainWindow.setProgressBar(1, { mode: 'none' });
		});
	});
};

module.exports.renderPoi = function () {
	getOverviewerPaths(function (exec, wd) {
		poiRenderer = spawn(exec, ['--config=../config.py', '--genpoi'], {
			cwd: wd,
			windowsHide: true
		});
		electron.mainWindow.webContents.send('overviewerRunProgress', 'poi');
		electron.mainWindow.setProgressBar(1, { mode: 'indeterminate' });
		poiRenderer.stdout.setEncoding('utf8');
		const progressTest = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+\s\w+\s\d+/;
		const progressCurrent = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+/;
		const progressMax = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s\d+\s\w+\s)\d+/;
		poiRenderer.stdout.on('data', function (data) {
			if (progressTest.test(data)) {
				electron.mainWindow.webContents.send('overviewerRunProgress', 'poi', progressMax.exec(data), progressCurrent.exec(data));
				if (parseInt(progressCurrent.exec(data)) < parseInt(progressMax.exec(data))) {
					electron.mainWindow.setProgressBar(parseFloat(progressCurrent.exec(data)) / parseFloat(progressMax.exec(data)), { mode: 'normal' });
				} else {
					electron.mainWindow.setProgressBar(1, { mode: 'none' });
				}
			}
			logging.messageLog(data);
		});
		poiRenderer.stderr.on('data', function (data) {
			logging.messageLog(data);
		});
		poiRenderer.on('close', function (exitCode) {
			logging.messageLog('Closed with code ' + exitCode);
			electron.mainWindow.webContents.send('overviewerRunProgress', 'poi', '1', '1');
			electron.mainWindow.setProgressBar(1, { mode: 'none' });
		});
	});
};

module.exports.renderWebAssets = function () {
	getOverviewerPaths(function (exec, wd) {
		webassRenderer = spawn(exec, ['--config=../config.py', '--update-web-assets'], {
			cwd: wd,
			windowsHide: true
		});
		electron.mainWindow.webContents.send('overviewerRunProgress', 'webass');
		electron.mainWindow.setProgressBar(1, { mode: 'indeterminate' });
		webassRenderer.stdout.setEncoding('utf8');
		const progressTest = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+\s\w+\s\d+/;
		const progressCurrent = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+/;
		const progressMax = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s\d+\s\w+\s)\d+/;
		webassRenderer.stdout.on('data', function (data) {
			if (progressTest.test(data)) {
				electron.mainWindow.webContents.send('overviewerRunProgress', 'webass', progressMax.exec(data), progressCurrent.exec(data));
				if (parseInt(progressCurrent.exec(data)) < parseInt(progressMax.exec(data))) {
					electron.mainWindow.setProgressBar(parseFloat(progressCurrent.exec(data)) / parseFloat(progressMax.exec(data)), { mode: 'normal' });
				} else {
					electron.mainWindow.setProgressBar(1, { mode: 'none' });
				}
			}
			logging.messageLog(data);
		});
		webassRenderer.stderr.on('data', function (data) {
			logging.messageLog(data);
		});
		webassRenderer.on('close', function (exitCode) {
			logging.messageLog('Closed with code ' + exitCode);
			electron.mainWindow.webContents.send('overviewerRunProgress', 'webass', '1', '1');
			electron.mainWindow.setProgressBar(1, { mode: 'none' });
		});
	});
};

module.exports.stopRenderMap = function () {
	mapRenderer.kill();
	electron.mainWindow.webContents.send('overviewerRunProgress', 'map', '1', '1');
	electron.mainWindow.setProgressBar(1, { mode: 'none' });
};

module.exports.stopRenderPoi = function () {
	poiRenderer.kill();
	electron.mainWindow.webContents.send('overviewerRunProgress', 'poi', '1', '1');
	electron.mainWindow.setProgressBar(1, { mode: 'none' });
};

module.exports.stopRenderWebAssets = function () {
	webassRenderer.kill();
	electron.mainWindow.webContents.send('overviewerRunProgress', 'webass', '1', '1');
	electron.mainWindow.setProgressBar(1, { mode: 'none' });
};