'use strict';

const { ipcRenderer } = require('electron');

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