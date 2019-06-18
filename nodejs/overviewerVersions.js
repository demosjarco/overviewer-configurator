const { app } = require('electron');
const fs = require('fs');
const request = require('request');
const electron = require('./electronSetup.js');

module.exports.updateLocalOverviewerVersion = function (temp) {
	updateLocalOverviewerVersion(temp);
};
function updateLocalOverviewerVersion(currentVersionCallback) {
	fs.readdir(app.getPath('userData'), function (err, files) {
		if (err) throw err;

		let currentVersion = 'Not installed';
		files.forEach(function (fileName) {
			const overviewerFolderReg = /(?<=overviewer-)\d+\.\d+\.\d+(?!.zip)$/;
			if (overviewerFolderReg.test(fileName))
				currentVersion = overviewerFolderReg.exec(fileName)[0];
		});
		electron.setOverviewerCurrentVersionMenu(currentVersion);
		if (currentVersionCallback)
			currentVersionCallback(currentVersion);
	});
}

module.exports.updateOverviewerVersions = function (temp) {
	updateOverviewerVersions(temp);
};
function updateOverviewerVersions(latestVersionCallback) {
	const os = require('os');
	let osType = '';
	switch (os.platform()) {
		case 'win32':
			const platformReg = /^\w+\D+/;
			const archReg = /(?<=^x)\d+$/;
			osType = platformReg.exec(os.platform()) + archReg.exec(os.arch());
			break;
	}
	console.log('https://overviewer.org/build/json/builders/' + osType + '/builds/_all');
	request('https://overviewer.org/build/json/builders/' + osType + '/builds/_all', function (error, response, body) {
		if (error || response.statusCode != 200) {
			mainMenuTemplate[1].submenu[2].sublabel = 'Error loading';
		} else {
			let json = Object.values(JSON.parse(body));
			electron.emptyOverviewerVersionsMenu();
			let latestVersion;
			json.forEach(function (version) {
				version.properties.forEach(function (property) {
					if (property[0] == 'version') {
						version.steps.forEach(function (step) {
							if (step.name == 'upload') {
								if (Object.values(step.urls)[0]) {
									electron.addNewOverviewerVersionMenu({
										label: property[1],
										click() {
											updateOverviewer(Object.values(step.urls)[0].replace(/http(?!s)/g, "https"));
										}
									});
								} else {
									electron.addNewOverviewerVersionMenu({
										label: property[1],
										enabled: false
									});
								}
								latestVersion = property[1];
							}
						});
					}
				});
			});
			electron.reverseOverviewerVersionMenu();
			if (latestVersionCallback)
				latestVersionCallback(latestVersion);
		}
	});
}

const AdmZip = require('adm-zip');
const rimraf = require('rimraf');
const logging = require('./logging.js');
function updateOverviewer(link) {
	electron.mainWindow.setProgressBar(0, { mode: 'indeterminate' });
	logging.messageLog('Checking for old overviewer version');
	fs.readdir(app.getPath('userData'), function (err, files) {
		if (err) throw err;

		let exists = false;
		files.forEach(function (fileName) {
			const overviewerFolderReg = /(?<=overviewer-)\d+\.\d+\.\d+(?!.zip)$/;
			if (overviewerFolderReg.test(fileName)) {
				exists = true;
				logging.messageLog('Deleting old overviewer version');
				rimraf(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/', function (err2) {
					if (err2) throw err2;

					logging.messageLog('Deleted old overviewer version');
					beginDownload();
				});
			}
		});
		if (!exists) {
			logging.messageLog('No old version detected');
			beginDownload();
		}
	});
	function beginDownload() {
		logging.messageLog('Downloading overviewer zip');
		const fileNameReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/win64\/\d+\/)overviewer-\d+\.\d+\.\d+\.\w+$/;
		let fileSize = 0;
		let downloadedSize = 0;
		request(link).on('response', function (response) {
			fileSize = parseInt(response.headers['content-length']);
		}).on('data', function (chunk) {
			downloadedSize += parseInt(chunk.length);
			electron.mainWindow.setProgressBar(downloadedSize / fileSize, { mode: 'normal' });
		}).on('close', function () {
			logging.messageLog('Downloaded overviewer zip');
			electron.mainWindow.setProgressBar(1, { mode: 'indeterminate' });
			let zip = new AdmZip(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(link)[0]);
			zip.extractAllTo(app.getPath('userData').replace(/\\/g, "/") + '/', true);
			logging.messageLog('Extracted overviewer zip');
			fs.unlink(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(link)[0], (err) => {
				if (err) throw err;
				logging.messageLog('Deleted overviewer zip');
				electron.mainWindow.setProgressBar(1, { mode: 'none' });
			});
			updateLocalOverviewerVersion(function (currentVersion) {
				electron.mainWindow.webContents.send('gotOverviewerVersion', currentVersion);
			});
			updateOverviewerVersions(function (latestVersion) {
				electron.mainWindow.webContents.send('gotLatestOverviewerVersion', latestVersion);
			});
		}).pipe(fs.createWriteStream(app.getPath('userData').replace(/\\/g, "/") + '/' + fileNameReg.exec(link)[0]));
	}
}