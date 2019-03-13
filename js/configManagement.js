function readSavedSetting() {

}

function localRenderProgressChanged(checked) {
	ipcRenderer.send('changedSetting', 'global', checked, 'renderProgress', 'local');
}
function webRenderProgressChanged(checked) {
	ipcRenderer.send('changedSetting', 'global', checked, 'renderProgress', 'web');
}