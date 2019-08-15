'use strict';

const { ipcRenderer } = require('electron');

$(function () {
	macOsTheme();
});

function macOsTheme() {
	const os = require('os');
	if (os.platform() == 'darwin') {
		$('aside').css('background-color', 'rgba(45,105,35,1.0)');
	}
}