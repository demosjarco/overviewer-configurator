'use strict';

const {app, BrowserWindow, ipcMain, powerSaveBlocker, Menu} = require('electron');
const request = require('request');
const fs = require('fs');

let mainWindow;
let devMode = process.argv[process.argv.length-1] == '--dev' ? true : false;

let mainMenuTemplate = [
	{
		label: 'File',
		submenu: [
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		label: 'Overviewer',
		submenu: [
			{
				label: 'Version Installed',
				sublabel: 'Loading...',
				enabled: false
			},
			{
				type: 'separator'
			},
			{
				label: 'Versions',
				sublabel: 'Loading...'
			}
		]
	},
	{
		label: 'Compression',
		submenu: [
		
		]
	},
	{
		role: 'help',
		submenu: [
			{
				role: 'toggleDevTools',
			},
			{
				label: 'Issues',
				click() {
					require('electron').shell.openExternal('https://github.com/demosjarco/overviewer-configurator/issues')
				}
			},
			{
				label: 'GitHub',
				click() {
					require('electron').shell.openExternal('https://github.com/demosjarco/overviewer-configurator')
				}
			}
		]
	}
];

app.on('ready', () => {
	// Create the browser window.
	let workArea = require('electron').screen.getPrimaryDisplay().workArea;
	if (devMode) {
		require('electron').screen.getAllDisplays().forEach(function(display) {
			if (display.size.width < 1920)
				workArea = display.workArea;
		});
	} else {
		workArea = require('electron').screen.getPrimaryDisplay().workArea;
	}
	
	mainWindow = new BrowserWindow({
		width: workArea.width,
		height: workArea.height,
		x: workArea.x,
		y: workArea.y,
		minWidth: 800,
		minHeight: 600,
		title: 'Overviewer Config',
		frame: true,
		backgroundColor: '#212121',
		darkTheme: true,
		vibrancy: 'dark',
		webPreferences: {
			devTools: true,
			scrollBounce: true,
			//enableBlinkFeatures: 'OverlayScrollbars'
		}
	});
	mainWindow.maximize();
	
	// and load the index.html of the app.
	mainWindow.loadFile('./html/mainWindow.html');
	Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
	//mainWindow.webContents.openDevTools();
	
	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	updateLocalOverviewerVersion();
	updateOverviewerVersions();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

function messageLog(message, showOnUi = true) {
	if (showOnUi)
		mainWindow.webContents.send('visualLog', message);
	console.log(message);
}

ipcMain.on('getOverviewerVersion', (event, arg) => {
	updateLocalOverviewerVersion(function(currentVersion) {
		event.sender.send('gotOverviewerVersion', currentVersion);
	});
});

function updateLocalOverviewerVersion(currentVersionCallback) {
	fs.readdir(app.getPath('userData'), function(err, files) {
		if (err) throw err;

		let currentVersion = 'Not installed';
		files.forEach(function (fileName) {
			const overviewerFolderReg = /(?<=overviewer-)\d+\.\d+\.\d+(?!.zip)$/;
			if (overviewerFolderReg.test(fileName))
				currentVersion = overviewerFolderReg.exec(fileName)[0];
		});
		mainMenuTemplate[1].submenu[0].sublabel = currentVersion;
		Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
		if (currentVersionCallback)
			currentVersionCallback(currentVersion);
	});
}

ipcMain.on('getLatestOverviewerVersion', (event, arg) => {
	updateOverviewerVersions(function (latestVersion) {
		event.sender.send('gotLatestOverviewerVersion', latestVersion);
	});
});

function updateOverviewerVersions(latestVersionCallback) {
	request('https://overviewer.org/build/json/builders/win64/builds/_all', function(error, response, body) {
		if (error || response.statusCode != 200) {
			mainMenuTemplate[1].submenu[2].sublabel = 'Error loading';
		} else {
			let json = Object.values(JSON.parse(body));
			delete mainMenuTemplate[1].submenu[2].sublabel;
			mainMenuTemplate[1].submenu[2].submenu = [];
			let latestVersion;
			json.forEach(function(version) {
				version.properties.forEach(function(property) {
					if (property[0] == 'version') {
						version.steps.forEach(function(step) {
							if (step.name == 'upload') {
								mainMenuTemplate[1].submenu[2].submenu.push({label: property[1], click() {
									updateOverviewer(Object.values(step.urls)[0]);
								}
								});
								latestVersion = property[1];
							}
						});
					}
				});
			});
			mainMenuTemplate[1].submenu[2].submenu.reverse();
			Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
			if (latestVersionCallback)
				latestVersionCallback(latestVersion);
		}
	});
}

const AdmZip = require('adm-zip');
const rimraf = require('rimraf');
function updateOverviewer(link) {
	mainWindow.setProgressBar(0, { mode: 'indeterminate' });
	messageLog('Checking for old overviewer version');
	fs.readdir(app.getPath('userData'), function (err, files) {
		if (err) throw err;

		let exists = false;
		files.forEach(function (fileName) {
			const overviewerFolderReg = /(?<=overviewer-)\d+\.\d+\.\d+(?!.zip)$/;
			if (overviewerFolderReg.test(fileName)) {
				exists = true;
				messageLog('Deleting old overviewer version');
				rimraf(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/', function (err2) {
					if (err2) throw err2;

					messageLog('Deleted old overviewer version');
					beginDownload();
				});
			}
		});
		if (!exists) {
			messageLog('No old version detected');
			beginDownload();
		}
	});
	function beginDownload() {
		messageLog('Downloading overviewer zip');
		const fileNameReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/win64\/\d+\/)overviewer-\d+\.\d+\.\d+\.\w+$/;
		let fileSize = 0;
		let downloadedSize = 0;
		request(link).on('response', function (response) {
			fileSize = parseInt(response.headers['content-length']);
		}).on('data', function (chunk) {
			downloadedSize += parseInt(chunk.length);
			mainWindow.setProgressBar(downloadedSize / fileSize, { mode: 'normal' });
		}).on('close', function () {
			messageLog('Downloaded overviewer zip');
			mainWindow.setProgressBar(1, { mode: 'indeterminate' });
			let zip = new AdmZip(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(link)[0]);
			zip.extractAllTo(app.getPath('userData').replace(/\\/g, "/") + '/', true);
			messageLog('Extracted overviewer zip');
			fs.unlink(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(link)[0], (err) => {
				if (err) throw err;
				messageLog('Deleted overviewer zip');
				mainWindow.setProgressBar(1, { mode: 'none' });
			});
			updateLocalOverviewerVersion(function (currentVersion) {
				mainWindow.webContents.send('gotOverviewerVersion', currentVersion);
			});
			updateOverviewerVersions(function (latestVersion) {
				mainWindow.webContents.send('gotLatestOverviewerVersion', latestVersion);
			});
		}).pipe(fs.createWriteStream(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(link)[0]));
	}
}

const config = require('./nodejs/configFile.js');