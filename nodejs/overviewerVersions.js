const { app, ipcMain } = require('electron');
const fs = require('fs');
const request = require('request');
const electron = require('./electronSetup.js');
const logging = require('./logging.js');

const overviewerFolderReg = /(?<=(minecraft\-)?overviewer-)\d+\.\d+\.\d+(?!\.\w+(\.\w+)?)/i;
const versionReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/(win64|win32|src)\/\d+\/overviewer-)\d+\.\d+\.\d+/;

ipcMain.on('getLocalOverviewerVersion', (event, arg) => {
	updateLocalOverviewerVersion(function (currentVersion) {
		event.sender.send('localOverviewerVersion', currentVersion);
	});
});

function updateLocalOverviewerVersion(currentVersionCallback = null) {
	fs.readdir(app.getPath('userData'), function (err, files) {
		if (err) throw err;

		let currentVersion;
		files.forEach(function (fileName) {
			if (overviewerFolderReg.test(fileName))
				currentVersion = overviewerFolderReg.exec(fileName)[0];
		});
		if (currentVersion && currentVersionCallback)
			currentVersionCallback(currentVersion);
	});
}

ipcMain.on('getOverviewerVersions', (event, arg) => {
	updateOverviewerVersions(function (versions) {
		event.sender.send('latestOverviewerVersion', versions);
	}, function (version, url, changeMessage) {
		event.sender.send('newOverviewerVersions', version, url, changeMessage);
	}, function () {
		event.sender.send('doneOverviewerVersions');
	}, function (message) {
		event.sender.send('errorOverviewerVersions', message);
	});
});

function updateOverviewerVersions(latestVersionCallback = null, versionsCallback = null, doneCallback = null, errorCallback = null) {
	const os = require('os');
	let osType = '';
	switch (os.platform()) {
		case 'darwin':
			osType = 'src';
			break;
		case 'win32':
			const platformReg = /^\w+\D+/;
			const archReg = /(?<=^x)\d+$/;
			osType = platformReg.exec(os.platform()) + archReg.exec(os.arch());
			break;
	}
	request('https://overviewer.org/build/api/v2/builders/' + osType + '/builds', function (error1, response1, body1) {
		if (error1) {
			errorCallback(error1.message);
			logging.messageLog('HTTP ' + response1.statusCode + ' https://overviewer.org/build/api/v2/builders/' + osType + '/builds | ' + error1);
		} else if (response1.statusCode != 200) {
			errorCallback('HTTP Error ' + response1.statusCode);
			logging.messageLog('HTTP ' + response1.statusCode + ' https://overviewer.org/build/api/v2/builders/' + osType + '/builds');
		} else {
			let temp = JSON.parse(body1).builds;
			let builds = [];
			temp.forEach(function (build) {
				if (build.complete && build.state_string == 'build successful')
					builds.push(build);
			});
			if (builds.length > 0) {
				builds.sort(function (a, b) {
					return new Date(b.started_at) - new Date(a.started_at);
				});

				let buildLoopCounter = 0;
				let goodBuildLimit = 0;
				function buildLoop(buildNumber) {
					console.log('https://overviewer.org/build/api/v2/builders/' + osType + '/builds/' + buildNumber);
					request('https://overviewer.org/build/api/v2/builders/' + osType + '/builds/' + buildNumber + '/steps/upload', function (error2, response2, body2) {
						if (error2) {
							logging.messageLog('HTTP ' + response2.statusCode + ' https://overviewer.org/build/api/v2/builders/' + osType + '/builds/' + buildNumber + '/steps/upload | ' + error2);
						} else if (response2.statusCode != 200) {
							logging.messageLog('HTTP ' + response2.statusCode + ' https://overviewer.org/build/api/v2/builders/' + osType + '/builds/' + buildNumber + '/steps/upload');
						} else {
							const archiveUrl = JSON.parse(body2).steps[0].urls[0].url.replace(/http(?!s)/g, "https");
							if (versionReg.test(archiveUrl)) {
								if (versionsCallback) {
									versionsCallback(versionReg.exec(archiveUrl)[0], archiveUrl);
								}

								if (latestVersionCallback && buildNumber == builds[0].number) {
									latestVersionCallback(versionReg.exec(archiveUrl)[0]);
								}
							}
						}

						buildLoopCounter++;
						goodBuildLimit++;
						if (buildLoopCounter < builds.length && goodBuildLimit < 10) {
							buildLoop(builds[buildLoopCounter].number);
						} else {
							if (doneCallback)
								doneCallback();
						}
					});
				}
				buildLoop(builds[buildLoopCounter].number);
			} else {
				errorCallback('No builds found for ' + osType);
				logging.messageLog('No builds found for ' + osType);
			}
		}
	});
}

ipcMain.on('updateOverviewerVersion', (event, link) => {
	updateOverviewer(link, function (visible, progress) {
		event.sender.send('progressOverviewerVersion', visible, versionReg.exec(link)[0], progress);
	});
});

function updateOverviewer(link, chunkUpdate = null) {
	electron.mainWindow.setProgressBar(Infinity, { mode: 'indeterminate' });
	if (chunkUpdate)
		chunkUpdate(true)
	logging.messageLog('Checking for old overviewer version');
	fs.readdir(app.getPath('userData'), function (err, files) {
		if (err) throw err;

		let exists = false;
		files.forEach(function (fileName) {
			if (overviewerFolderReg.test(fileName)) {
				exists = true;
				logging.messageLog('Deleting old overviewer version');
				require('rimraf')(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName + '/', function (err2) {
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
		const fileNameReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/(win64|win32|src)\/\d+\/)overviewer-\d+\.\d+\.\d+\.\w+(.\w+)?/;
		const fileName = fileNameReg.exec(link)[0];
		let fileSize = 0;
		let downloadedSize = 0;
		if (fileNameReg.test(link)) {
			request(link.replace(/http(?!s)/g, "https")).on('response', function (response) {
				fileSize = parseInt(response.headers['content-length']);
			}).on('data', function (chunk) {
				downloadedSize += parseInt(chunk.length);
				electron.mainWindow.setProgressBar(downloadedSize / fileSize, { mode: 'normal' });
				if (chunkUpdate)
					chunkUpdate(true, downloadedSize / fileSize)
			}).on('close', function () {
				logging.messageLog('Downloaded overviewer archive');
				electron.mainWindow.setProgressBar(Infinity, { mode: 'indeterminate' });
				if (chunkUpdate)
					chunkUpdate(true, 1.00)
				const archiveExtension = /(?<=overviewer-\d+\.\d+\.\d+)\.\w+(\.\w+)?/;
				switch (archiveExtension.exec(fileName)[0]) {
					case '.zip':
						const AdmZip = require('adm-zip');
						let zip = new AdmZip(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName);
						zip.extractAllTo(app.getPath('userData').replace(/\\/g, "/") + '/', true);
						doneExtract();
						break;
					case '.tar.gz':
						const gunzip = require('gunzip-maybe');
						fs.createReadStream(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName)
							.pipe(gunzip())
							.pipe(fs.createWriteStream(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName.replace(/\.gz/g, '')))
							.on('close', function () {
								const tar = require('tar-fs');
								fs.createReadStream(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName.replace(/\.gz/g, '')).pipe(tar.extract(app.getPath('userData').replace(/\\/g, "/") + '/').on('finish', function () {
									fs.unlink(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName.replace(/\.gz/g, ''), (err) => {
										if (err) throw err;
										doneExtract();
									});
								}));
							});
						break;
				}

				function doneExtract() {
					logging.messageLog('Extracted overviewer archive');
					fs.unlink(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName, (err) => {
						if (err) throw err;
						logging.messageLog('Deleted overviewer archive');
						electron.mainWindow.setProgressBar(-Infinity, { mode: 'none' });
						if (chunkUpdate)
							chunkUpdate(false)
						updateLocalOverviewerVersion(function (currentVersion) {
							electron.mainWindow.webContents.send('localOverviewerVersion', currentVersion);
						});
					});
				}
			}).pipe(fs.createWriteStream(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName));
		}
	}
}