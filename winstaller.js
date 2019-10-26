'use strict';

require('electron-winstaller').createWindowsInstaller({
	appDirectory: 'builds/packaged/Overviewer Configurator-win32-x64',
	outputDirectory: 'builds/installers',
	exe: 'Overviewer Configurator.exe',
	setupExe: 'overviewer-configurator-installer.exe',
}).then(() => {
	console.log('Installer created');
}, (error) => {
	throw error;
});