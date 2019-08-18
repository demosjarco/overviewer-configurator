'use strict';

const { ipcRenderer } = require('electron');
const mainWindow = require('electron').remote.getCurrentWindow();

$(function () {

});

function minimize() {
	ipcRenderer.send('minimize');
}
function maximize() {
	ipcRenderer.send('maximize');
}
function closeWindow() {
	ipcRenderer.send('close');
}