function readSavedSetting() {

}

function localRenderProgressChanged(checked) {
	ipcRenderer.send('changedSetting', checked, 'global', 'renderProgress', 'local');
}
function webRenderProgressChanged(checked) {
	ipcRenderer.send('changedSetting', checked, 'global', 'renderProgress', 'web');
}