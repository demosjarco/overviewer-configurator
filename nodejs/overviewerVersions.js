const { app } = require('electron');
const fs = require('fs');
const request = require('request');
const electron = require('./electronSetup.js');

module.exports.updateLocalOverviewerVersion = function (temp) {
	updateLocalOverviewerVersion(temp);
};
const overviewerFolderReg = /(?<=(minecraft\-)?overviewer-)\d+\.\d+\.\d+(?!\.\w+(\.\w+)?)/i;
function updateLocalOverviewerVersion(currentVersionCallback) {
	fs.readdir(app.getPath('userData'), function (err, files) {
		if (err) throw err;

		let currentVersion = 'Not installed';
		files.forEach(function (fileName) {
			if (overviewerFolderReg.test(fileName))
				currentVersion = overviewerFolderReg.exec(fileName)[0];
		});
		electron.setOverviewerCurrentVersionMenu(currentVersion);
		if (currentVersionCallback)
			currentVersionCallback(currentVersion);
	});
}

module.exports.updateOverviewerVersions = function (temp = null) {
	updateOverviewerVersions(temp);
};
function updateOverviewerVersions(latestVersionCallback = null) {
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
		if (error1 || response1.statusCode != 200) {
			problemGettingBuilds();
		} else {
			electron.emptyOverviewerVersionsMenu();
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
				function buildLoop(buildNumber) {
					request('https://overviewer.org/build/api/v2/builders/' + osType + '/builds/' + buildNumber + '/steps/upload', function (error2, response2, body2) {
						if (error2 || response2.statusCode != 200) {
							logging.messageLog('HTTP ' + response2.statusCode + ' https://overviewer.org/build/api/v2/builders/' + osType + '/builds/' + buildNumber + '/steps/upload | ' + error2);
						} else {
							const archiveUrl = JSON.parse(body2).steps[0].urls[0].url.replace(/http(?!s)/g, "https");
							const versionReg = /(?<=htt(p:|ps:)\/\/overviewer.org\/builds\/(win64|win32|src)\/\d+\/overviewer-)\d+\.\d+\.\d+/;
							electron.addNewOverviewerVersionMenu({
								label: versionReg.exec(archiveUrl),
								click() {latestVersionCallback
									updateOverviewer(archiveUrl);
								}
							});

							if (buildNumber == builds[0].number && latestVersionCallback) {
								latestVersionCallback(versionReg.exec(archiveUrl));
							}
						}

						buildLoopCounter++;
						if (buildLoopCounter < builds.length) {
							buildLoop(buildLoopCounter);
						}
					});
				}
				buildLoop(buildLoopCounter);
			} else {
				problemGettingBuilds();
			}
		}

		function problemGettingBuilds() {
			electron.errorOverviewerVersionMenu();
			logging.messageLog('HTTP ' + response1.statusCode + ' https://overviewer.org/build/api/v2/builders/' + osType + '/builds | ' + error1);
			if (latestVersionCallback)
				latestVersionCallback('Error...');
		}
	});
	/*request('https://overviewer.org/build/json/builders/' + osType + '/builds/_all', function (error, response, body) {
		if (error || response.statusCode != 200) {
			electron.errorOverviewerVersionMenu();
			logging.messageLog('HTTP ' + response.statusCode + ' | ' + error);
			if (latestVersionCallback)
				latestVersionCallback('Error...');
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
	});*/
}

const logging = require('./logging.js');
function updateOverviewer(link) {
	electron.mainWindow.setProgressBar(Infinity, { mode: 'indeterminate' });
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
			}).on('close', function () {
				logging.messageLog('Downloaded overviewer archive');
				electron.mainWindow.setProgressBar(Infinity, { mode: 'indeterminate' });
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
						updateLocalOverviewerVersion(function (currentVersion) {
							electron.mainWindow.webContents.send('gotOverviewerVersion', currentVersion);
						});
					});
				}
			}).pipe(fs.createWriteStream(app.getPath('userData').replace(/\\/g, "/") + '/' + fileName));
		}
	}
}