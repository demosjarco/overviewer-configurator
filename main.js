'use strict';

const {app, BrowserWindow, ipcMain, powerSaveBlocker, Menu} = require('electron');
const request = require('request');
const fs = require('fs');

let mainWindow;
let devMode = process.argv[process.argv.length-1] == '--dev' ? true : false;

let mainMenuTemplate = [
	{
		label: 'Global',
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
				sublabel: 'Loading...'
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
			scrollBounce: true
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

function updateLocalOverviewerVersion(newVersionCallback) {
	fs.readdir(app.getPath('userData'), function(err, files) {
		if (err) throw err;

		let currentVersion = 'Not installed';
		files.forEach(function (fileName) {
			const overviewerFolderReg = /(?<=overviewer-)\d+\.\d+\.\d+/;
			if (overviewerFolderReg.test(fileName))
				currentVersion = overviewerFolderReg.exec(fileName)[0];
		});
		mainMenuTemplate[1].submenu[0].sublabel = currentVersion;
		Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
		if (newVersionCallback) {
			if (currentVersion != 'Not installed') {
				newVersionCallback(true);
			} else {
				newVersionCallback(false);
			}
		}
	});
}

function updateOverviewerVersions() {
	request('https://overviewer.org/build/json/builders/win64/builds/_all', function(error, response, body) {
		if (error || response.statusCode != 200) {
			mainMenuTemplate[1].submenu[2].sublabel = 'Error loading';
		} else {
			let json = Object.values(JSON.parse(body));
			delete mainMenuTemplate[1].submenu[2].sublabel;
			mainMenuTemplate[1].submenu[2].submenu = [];
			json.forEach(function(version) {
				version.properties.forEach(function(property) {
					if (property[0] == 'version') {
						version.steps.forEach(function(step) {
							if (step.name == 'upload') {
								mainMenuTemplate[1].submenu[2].submenu.push({label: property[1], click() {
									updateOverviewer(Object.values(step.urls)[0]);
								}});
							}
						});
					}
				});
			});
			mainMenuTemplate[1].submenu[2].submenu.reverse();
			Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
			updateLocalOverviewerVersion(function (newVersionAvailable) {
				if (newVersionAvailable) {
					mainMenuTemplate[1].submenu[2].sublabel = 'Update available';
					Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
				}
			});
		}
	});
}

function updateOverviewer(link) {
	console.log(link);
}