const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;
module.exports.mainWindow = mainWindow;
let devMode = process.argv[process.argv.length - 1] == '--dev' ? true : false;

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

const overviewerVersions = require('./overviewerVersions.js');

app.on('ready', () => {
	// Create the browser window.
	let workArea = require('electron').screen.getPrimaryDisplay().workArea;
	if (devMode) {
		require('electron').screen.getAllDisplays().forEach(function (display) {
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

	module.exports.mainWindow = mainWindow;
	overviewerVersions.updateLocalOverviewerVersion();
	overviewerVersions.updateOverviewerVersions();
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

module.exports.setCurrentVersionMenu = function(currentVersion) {
	mainMenuTemplate[1].submenu[0].sublabel = currentVersion;
	Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
}
module.exports.deleteLeadingVersionsMenu = function() {
	delete mainMenuTemplate[1].submenu[2].sublabel;
	mainMenuTemplate[1].submenu[2].submenu = [];
}
module.exports.addNewVersionMenu = function(menuItem) {
	mainMenuTemplate[1].submenu[2].submenu.push(menuItem);
}
module.exports.reverseVersionMenu = function() {
	mainMenuTemplate[1].submenu[2].submenu.reverse();
	Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
}