ipcRenderer.on('clearWorlds', function (event, arg) {
	$('aside ul li.worldItem').remove();
});

ipcRenderer.on('gotWorld', function (event, worldNickName) {
	
});