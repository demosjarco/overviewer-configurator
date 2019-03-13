ipcRenderer.send('readOldSettings');
ipcRenderer.on('readSetting_global_renderProgress_local', function (event, value) {
	$('.setting.global.renderProgress.local').prop('checked', value);
});
ipcRenderer.on('readSetting_global_renderProgress_web', function (event, value) {
	$('.setting.global.renderProgress.web').prop('checked', value);
});

function localRenderProgressChanged(checked) {
	ipcRenderer.send('changedSetting', checked, 'global', 'renderProgress', 'local');
}
function webRenderProgressChanged(checked) {
	ipcRenderer.send('changedSetting', checked, 'global', 'renderProgress', 'web');
}