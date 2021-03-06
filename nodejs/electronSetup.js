const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const overviewerVersions = require('./overviewerVersions.js');
require('./worldManagement.js');

const setMan = require("./settingsManager.js");
const SettingsManager = new setMan();
module.exports.settingsManager = SettingsManager;

let mainWindow;

function createWindow() {
	// Create the browser window.
	let mainWindowState = require('electron-window-state')({
		defaultWidth: 1024,
		defaultHeight: 768
	});
	mainWindow = new BrowserWindow({
		width: mainWindowState.width,
		height: mainWindowState.height,
		x: mainWindowState.x,
		y: mainWindowState.y,
		minWidth: 1024,
		minHeight: 768,
		title: 'Overviewer Config',
		show: false,
		frame: true,
		backgroundColor: (process.platform !== 'darwin') ? '#212121' : null,
		darkTheme: true,
		vibrancy: 'ultra-dark',
		webPreferences: {
			devTools: true,
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
			webSecurity: true,
			allowRunningInsecureContent: false,
			enableBlinkFeatures: 'OverlayScrollbars'
		}
	});

	mainWindowState.manage(mainWindow);

	// and load the index.html of the app.
	mainWindow.loadFile('./html/mainWindow.html');
	Menu.setApplicationMenu(Menu.buildFromTemplate(createMenu()));
	//mainWindow.webContents.openDevTools();

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	})

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
		module.exports.mainWindow = mainWindow;
	});

	module.exports.mainWindow = mainWindow;
}

app.on('ready', () => {
	createWindow();
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

function createMenu() {
	let temp = [
		{
			role: 'fileMenu'
		},
		{
			role: 'help',
			submenu: [
				{
					role: 'toggleDevTools',
				},
				{
					label: 'Issues',
					click: async () => {
						const { shell } = require('electron')
						await shell.openExternal('https://github.com/demosjarco/overviewer-configurator/issues')
					}
				},
				{
					label: 'GitHub',
					click: async () => {
						const { shell } = require('electron')
						await shell.openExternal('https://github.com/demosjarco/overviewer-configurator')
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'Minecraft Overviewer',
					click: async () => {
						const { shell } = require('electron')
						await shell.openExternal('https://github.com/overviewer/Minecraft-Overviewer')
					}
				},
				{
					label: 'Oxipng',
					click: async () => {
						const { shell } = require('electron')
						await shell.openExternal('https://github.com/shssoichiro/oxipng')
					}
				},
				{
					label: 'Jpegoptim',
					click: async () => {
						const { shell } = require('electron')
						await shell.openExternal('https://github.com/tjko/jpegoptim')
					}
				}
			]
		}
	];
	if (process.platform === 'darwin') {
		temp.unshift({
			role: 'appMenu'
		});
	}
	return temp;
}