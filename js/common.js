'use strict';

const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const mainWindow = require('electron').remote.getCurrentWindow();

$(function () {
	windowSizeIcon();
});

function minimize() {
	ipcRenderer.send('minimize');
}
function windowSizeIcon() {
	if (mainWindow.isMaximized()) {
		$('li#windowSizing').find('span.mdi').addClass('mdi-window-restore');
	} else {
		$('li#windowSizing').find('span.mdi').addClass('mdi-window-maximize');
	}
	mainWindow.on('maximize', () => {
		$('li#windowSizing').find('span.mdi').removeClass('mdi-window-maximize');
		$('li#windowSizing').find('span.mdi').addClass('mdi-window-restore');
	});
	mainWindow.on('unmaximize', () => {
		$('li#windowSizing').find('span.mdi').removeClass('mdi-window-restore');
		$('li#windowSizing').find('span.mdi').addClass('mdi-window-maximize');
	});
}
function maximize() {
	ipcRenderer.send('maximize');
}
function closeWindow() {
	ipcRenderer.send('close');
}