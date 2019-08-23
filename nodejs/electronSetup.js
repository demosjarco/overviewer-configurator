const { app, BrowserWindow, ipcMain } = require('electron');
const overviewerVersions = require('./overviewerVersions.js');

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
		frame: false,
		backgroundColor: (process.platform !== 'darwin') ? '#212121' : null,
		darkTheme: true,
		vibrancy: 'ultra-dark',
		webPreferences: {
			devTools: true,
			nodeIntegration: true,
			enableRemoteModule: true,
			webSecurity: true,
			allowRunningInsecureContent: false,
			enableBlinkFeatures: 'OverlayScrollbars'
		}
	});

	mainWindowState.manage(mainWindow);

	// and load the index.html of the app.
	mainWindow.loadFile('./html/mainWindow.html');
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

ipcMain.on('minimize', (event) => {
	mainWindow.minimize();
});
ipcMain.on('maximize', (event) => {
	if (mainWindow.isMaximized()) {
		mainWindow.unmaximize();
	} else {
		mainWindow.maximize();
	}
});
ipcMain.on('close', (event) => {
	mainWindow.close();
});