'use strict';

const { argv } = require('process');

require('electron-winstaller').createWindowsInstaller({
	appDirectory: `builds/packaged/Overviewer Configurator-win32-${argv[2]}`,
	outputDirectory: 'builds/installers',
	exe: 'Overviewer Configurator.exe',
	setupExe: `overviewer-configurator-installer-${argv[2]}.exe`,
	// setupMsi: `overviewer-configurator-installer-${argv[2]}.msi`,
	noMsi: true
}).then(() => {
	console.log(`${argv[2]} Installer created`);
}, (error) => {
	throw error;
});