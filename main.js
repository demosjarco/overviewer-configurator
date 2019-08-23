'use strict';

const { ipcMain } = require('electron');

const runOverviewer = require('./nodejs/runOverviewer.js');
ipcMain.on('runOverviewer', (event, runType) => {
	switch (runType) {
		case 'map':
			runOverviewer.renderMap();
			break;
		case 'poi':
			runOverviewer.renderPoi();
			break;
		case 'webass':
			runOverviewer.renderWebAssets();
			break;
	}
});
ipcMain.on('stopOverviewer', (event, runType) => {
	switch (runType) {
		case 'map':
			runOverviewer.stopRenderMap();
			break;
		case 'poi':
			runOverviewer.stopRenderPoi();
			break;
		case 'webass':
			runOverviewer.stopRenderWebAssets();
			break;
	}
});