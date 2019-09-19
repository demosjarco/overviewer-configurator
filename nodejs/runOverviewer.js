'use strict';

const fs = require('fs');
const spawn = require('child_process').spawn;
const electron = require('./electronSetup.js');
const { ipcMain, app } = require('electron');
const logging = require('./logging.js');
let mapRenderer;
let poiRenderer;
let webassRenderer;

function getOverviewerPaths(callback) {
	fs.readdir(app.getPath('userData'), function (err, files) {
		if (err) throw err;

		files.forEach(function (fileName) {
			const overviewerFolderReg = /(?<=(minecraft\-)?overviewer-)\d+\.\d+\.\d+(?!\.\w+(\.\w+)?)/i;
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

function render(runType) {
	let commandParams = ['--config=../config.py'];
	switch (runType) {
		case 'map':
			commandParams.push('--processes');
			commandParams.push('' + require('os').cpus().length);
			break;
		case 'poi':
			commandParams.push('--genpoi');
			break;
		case 'webass':
			commandParams.push('--update-web-assets');
			break;
	}

	getOverviewerPaths(function (exec, wd) {
		let runningRenderer = spawn(exec, commandParams, {
			cwd: wd,
			windowsHide: true
		});

		switch (runType) {
			case 'map':
				mapRenderer = runningRenderer;
				break;
			case 'poi':
				poiRenderer = runningRenderer;
				break;
			case 'webass':
				webassRenderer = runningRenderer;
				break;
		}

		electron.mainWindow.webContents.send('overviewerRunProgress', runType, 0);
		electron.mainWindow.setProgressBar(1, { mode: 'indeterminate' });
		runningRenderer.stdout.setEncoding('utf8');
		const progressTest = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+\s\w+\s\d+/;
		const progressCurrent = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s)\d+/;
		const progressMax = /(?<=\d+-\d+-\d+\s\d+:\d+:\d+\s\s\w+\s\d+\s\w+\s)\d+/;
		runningRenderer.stdout.on('data', function (data) {
			if (progressTest.test(data)) {
				if (parseInt(progressCurrent.exec(data)) < parseInt(progressMax.exec(data))) {
					electron.mainWindow.webContents.send('overviewerRunProgress', runType, (parseFloat(progressCurrent.exec(data)) / parseFloat(progressMax.exec(data))) * 100);
					electron.mainWindow.setProgressBar(parseFloat(progressCurrent.exec(data)) / parseFloat(progressMax.exec(data)), { mode: 'normal' });
				} else {
					endProgress();
				}
			}
			logging.messageLog(data);

			const enterContinueReg = /Press\s\[Enter\]\sto\sclose\sthis\swindow\./gi;
			if (enterContinueReg.test(data)) {
				runningRenderer.stdin.write('\n', 'utf8');
			}

		});
		runningRenderer.stderr.on('data', (data) => {
			logging.messageLog(data);
		});
		runningRenderer.on('error', (err) => {
			logging.messageLog('Error: ' + err.message);
		});
		runningRenderer.on('close', (code, signal) => {
			logging.messageLog('Overviewer closed with code ' + code);
			endProgress();
		});
		runningRenderer.on('exit', (code, signal) => {
			logging.messageLog('Overviewer exited with code ' + code);
			endProgress();
		});

		function endProgress() {
			electron.mainWindow.webContents.send('overviewerRunProgress', runType, 100.0);
			electron.mainWindow.setProgressBar(1, { mode: 'none' });
		}
	});
}

ipcMain.on('runOverviewer', (event, runType) => {
	render(runType);
});
ipcMain.on('stopOverviewer', (event, runType) => {
	switch (runType) {
		case 'map':
			mapRenderer.kill();
			electron.mainWindow.webContents.send('overviewerRunProgress', runType, 100.0);
			electron.mainWindow.setProgressBar(1, { mode: 'none' });
			break;
		case 'poi':
			poiRenderer.kill();
			electron.mainWindow.webContents.send('overviewerRunProgress', runType, 100.0);
			electron.mainWindow.setProgressBar(1, { mode: 'none' });
			break;
		case 'webass':
			webassRenderer.kill();
			electron.mainWindow.webContents.send('overviewerRunProgress', runType, 100.0);
			electron.mainWindow.setProgressBar(1, { mode: 'none' });
			break;
	}
});