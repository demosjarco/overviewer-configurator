const { ipcRenderer } = require('electron');

function localRenderProgressChanged(checked) {
	ipcRenderer.send('changedGlobalConfigOption', checked, 'renderProgress', 'local');
}
function webRenderProgressChanged(checked) {
	ipcRenderer.send('changedGlobalConfigOption', checked, 'renderProgress', 'web');
}