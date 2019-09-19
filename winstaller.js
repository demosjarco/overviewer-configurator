'use strict';

module.exports = async function() {
	try {
		await require('electron-winstaller').createWindowsInstaller({
			appDirectory: 'builds/packaged/Overviewer Configurator-win32-x64',
			outputDirectory: 'builds/installers',
			exe: 'overviewer-configurator-installer.exe'
		});
		console.log('It worked!');
	} catch (e) {
		throw e;
	}
}