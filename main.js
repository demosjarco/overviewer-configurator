'use strict';

const { app, BrowserWindow, ipcMain, powerSaveBlocker } = require('electron');

let mainWindow;
let devMode = process.argv[process.argv.length-1] == '--dev' ? true : false;
let preventSleepId;

app.on('ready', () => {
	// Create the browser window.
	let workArea;
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
	mainWindow.setMenu(null);
	//mainWindow.webContents.openDevTools();
	
	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
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

var worlds = [];
var outputLoc = "";
var progressBars = "";
var compressInstalled = false;
var compress = "";
var caveDepthDraw = 'cave_noDepth = "cave"\n';

//preventSleepId = powerSaveBlocker.start('prevent-app-suspension');
//powerSaveBlocker.stop(preventSleepId);

const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');

ipcMain.on('getVersion', (event, arg) => {
	getVersion(event);
});
function getVersion(event) {
	fs.readdir(app.getPath('userData').replace(/\\/g, "/") + '/', function(err, files) {
		if (err)
			throw err;
		
		let exists = false;
		files.forEach(function(fileName) {
			const versionReg = /(?<=overviewer-)\d+\.\d+\.\d+/;
			if (versionReg.test(fileName)) {
				exists = true;
				let tempVersion = {current: versionReg.exec(fileName)[0]};
				
				request('https://overviewer.org/downloads', function (error, response, body) {
					if (error)
						throw error;
					
					const $ = cheerio.load(body);
					$('td').each((i, elem) => {
						let a = $(elem).find('a');
						const webVersionReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/win64\/\d+\/overviewer-)\d+\.\d+\.\d+/;
						const webVersionProgressReg = /^htt(p:|ps:)\/\/overviewer\.org\/build\/builders\/win64\/builds\/\d+$/;
						if (webVersionReg.test(a.attr('href'))) {
							tempVersion.latest = webVersionReg.exec(a.attr('href'))[0];
							event.sender.send('gotVersion', tempVersion);
						} else if (webVersionProgressReg.test(a.attr('href'))) {
							tempVersion.latest = 'Update in progress';
							event.sender.send('gotVersion', tempVersion);
						}
					});
				});
			}
		});
		if (!exists) {
			let tempVersion = {current: '0.0.0'};
			request('https://overviewer.org/downloads', function (error, response, body) {
				if (error)
					throw error;
				
				const $ = cheerio.load(body);
				$('td').each((i, elem) => {
					let a = $(elem).find('a');
					const webVersionReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/win64\/\d+\/overviewer-)\d+\.\d+\.\d+/;
					const webVersionProgressReg = /^htt(p:|ps:)\/\/overviewer\.org\/build\/builders\/win64\/builds\/\d+$/;
					if (webVersionReg.test(a.attr('href'))) {
						tempVersion.latest = webVersionReg.exec(a.attr('href'))[0];
						event.sender.send('gotVersion', tempVersion);
					} else if (webVersionProgressReg.test(a.attr('href'))) {
						tempVersion.latest = 'Update in progress';
						event.sender.send('gotVersion', tempVersion);
					}
				});
			});
		}
	});
}

const AdmZip = require('adm-zip');
ipcMain.once('updateOverviewer', (event, arg) => {
	console.log('Checking for old overviewer version');
	fs.readdir(app.getPath('userData').replace(/\\/g, "/") + '/', function(err, files) {
		if (err)
			throw err;
		
		files.forEach(function(fileName) {
			const versionReg = /(?<=overviewer-)\d+\.\d+\.\d+/;
			if (versionReg.test(fileName)) {
				console.log('Deleting old overviewer version');
				fs.unlink(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName, (err) => {
					if (err)
						throw err;
					
					console.log('Deleted old overviewer version');
				});
			}
		});
	});
	console.log('Getting overviewer version');
	request('https://overviewer.org/downloads', function (error, response, body) {
		if (error)
			throw error;

		const $ = cheerio.load(body);
		$('td').each((i, elem) => {
			let a = $(elem).find('a');
			const webVersionReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/win64\/\d+\/overviewer-)\d+\.\d+\.\d+/;
			if (webVersionReg.test(a.attr('href'))) {
				console.log(webVersionReg.exec(a.attr('href')));
				const fileNameReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/win64\/\d+\/)overviewer-\d+\.\d+\.\d+\.\w+$/;
				console.log('Downloading overviewer zip');
				request(a.attr('href')).pipe(fs.createWriteStream(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(a.attr('href'))[0])).on('close', function() {
					console.log('Downloaded overviewer zip');
					let zip = new AdmZip(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(a.attr('href'))[0]);
					zip.extractAllTo(app.getPath('userData').replace(/\\/g, "/") + '/', true);
					console.log('Extracted overviewer zip');
					fs.unlink(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(a.attr('href'))[0], (err) => {
						if (err)
							throw err;
						
						console.log('Deleted overviewer zip');
					});
					getVersion(event);
					// Move over .bat
				});
			}
		});
	});
});

ipcMain.on('getOxipng', (event, arg) => {
	getOxipng(event);
});
function getOxipng(event) {
	fs.readdir(app.getPath('userData').replace(/\\/g, "/") + '/', function(err, files) {
		if (err)
			throw err;
		
		let existsDir = false;
		files.forEach(function(fileName) {
			const versionReg = /(?<=overviewer-)\d+\.\d+\.\d+/;
			if (versionReg.test(fileName)) {
				existsDir = true;
				readOverviewerDir(fileName);
			}
		});
		if (!existsDir) {
			event.sender.send('gotOxipng', false);
		}
	});
	function readOverviewerDir(fileName) {
		let exists = false;
		fs.readdir(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/', function(err, files) {
			files.forEach(function(fileName) {
				const versionReg = /oxipng.exe/;
				if (versionReg.test(fileName)) {
					exists = true;
					event.sender.send('gotOxipng', true);
				}
			});
		});
		if (!exists) {
			event.sender.send('gotOxipng', false);
		}
	}
}

ipcMain.once('updateOxipng', (event, arg) => {
	console.log('Getting oxipng version');
	request({
		url: 'https://api.github.com/repos/shssoichiro/oxipng/releases/latest',
		headers: {
			'User-Agent': 'victhebeast'
		}
	}, function(error, response, body) {
		if (error)
			throw error;
		if (response.statusCode == 200) {
			const oxi64reg = /^oxipng-v\d+\.\d+\.\d+-x86_64-pc-windows-msvc.zip$/;
			JSON.parse(body).assets.forEach(function(asset) {
				if (oxi64reg.test(asset.name)) {
					downloadOxipng(asset.name, asset.browser_download_url);
				}
			});
		}
	});
	function downloadOxipng(name, url) {
		console.log('Downloading oxipng zip');
		request(url).pipe(fs.createWriteStream(app.getPath('userData').replace(/\\/g, "/") + '/' + name)).on('close', function() {
			console.log('Downloaded oxipng zip');
			let zip = new AdmZip(app.getPath('userData').replace(/\\/g, "/") + '/' + name);
			fs.readdir(app.getPath('userData').replace(/\\/g, "/") + '/', function(err, files) {
				if (err)
					throw err;
				
				files.forEach(function(fileName) {
					const versionReg = /(?<=overviewer-)\d+\.\d+\.\d+/;
					if (versionReg.test(fileName)) {
						zip.extractAllTo(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/', true);
						console.log('Extracted oxipng zip');
						fs.unlink(app.getPath('userData').replace(/\\/g, "/") + '/' + name, (err) => {
							if (err)
								throw err;
							
							console.log('Deleted oxipng zip');
						});
						getOxipng(event);
					}
				});
			});
		});
	}
});

ipcMain.once('getWorlds', (event, arg) => {
	fs.readdir('Z:/Minecraft Servers', function(err, files) {
		if (err)
			throw err;
		
		fs.readFile(app.getPath('userData').replace(/\\/g, "/") + '/worldPrefs.json', (err, data) => {
			if (err) {
				event.sender.send('gotWorlds', files, null);
			} else {
				event.sender.send('gotWorlds', files, JSON.parse(data));
			}
		});
	});
});

ipcMain.on('saveWorldPref', (event, worldPrefs) => {
	fs.writeFile(app.getPath('userData').replace(/\\/g, "/") + '/worldPrefs.json', JSON.stringify(worldPrefs, null, 5), (err) => {
		if (err)
			throw err;
		console.log('Written to ' + app.getPath('userData') + '\\worldPrefs.json');
	});
});

ipcMain.on('generateConfig', (event, config) => {
	fs.readdir(app.getPath('userData').replace(/\\/g, "/") + '/', function(err, files) {
		if (err)
			throw err;
		
		files.forEach(function(fileName) {
			const versionReg = /(?<=overviewer-)\d+\.\d+\.\d+/;
			if (versionReg.test(fileName)) {
				fs.writeFile(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/config.py', config, function(err2) {
					if (err2)
						throw err2;
				});
			}
		});
	});
});