$(function () {
	ipcRenderer.send('readOldSettings');
});
ipcRenderer.on('readSetting_global_worldsLocation', function (event, value) {
	$('.setting.global.worldsLocation').text(value);
	ipcRenderer.send('readWorlds');
});
ipcRenderer.on('readSetting_global_outputLocation', function (event, value) {
	$('.setting.global.outputLocation').text(value);
});
ipcRenderer.on('readSetting_global_renderProgress_local', function (event, value) {
	$('.setting.global.renderProgress.local').prop('checked', value);
});
ipcRenderer.on('readSetting_global_renderProgress_web', function (event, value) {
	$('.setting.global.renderProgress.web').prop('checked', value);
});
ipcRenderer.on('readSetting_global_compressLevel', function (event, value) {
	$('.setting.global.compressLevel').val(value);
});
ipcRenderer.on('readSetting_global_caveDepthShading', function (event, value) {
	$('.setting.global.caveDepthShading').prop('checked', value);
});

function worldsFolderSelection() {
	ipcRenderer.send('worldsFolderSelection');
}
function outputFolderSelection() {
	ipcRenderer.send('outputFolderSelection');
}
function localRenderProgressChanged(checked) {
	ipcRenderer.send('changedSetting', checked, 'global', 'renderProgress', 'local');
}
function webRenderProgressChanged(checked) {
	ipcRenderer.send('changedSetting', checked, 'global', 'renderProgress', 'web');
}
function compressLevelChanged(level) {
	ipcRenderer.send('changedSetting', parseInt(level), 'global', 'compressLevel');
}
function caveDepthShadingChanged(checked) {
	ipcRenderer.send('changedSetting', checked, 'global', 'caveDepthShading');
}