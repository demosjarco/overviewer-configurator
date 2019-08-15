'use strict';

const { ipcRenderer } = require('electron');

$(function () {

});

function minimize() {
	window.ipc.send('minimize');
}
function maximize() {
	window.ipc.send('maximize');
}
function close() {
	window.ipc.send('close');
}