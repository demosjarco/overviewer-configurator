let tabCounter = 2;

ipcRenderer.on('clearWorlds', function (event, arg) {
	$('aside ul li.worldItem').remove();
	tabCounter = 2;
});

ipcRenderer.on('gotWorld', function (event, worldNickName) {
	$('aside ul').append('<li class="worldItem"><a class="worlds" href="#tabs-' + tabCounter + '">[' + worldNickName + ']</a></li>');
	$("#tabs").tabs();
	tabCounter++;
});