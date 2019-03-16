let tabCounter = 2;

function redoTabs() {
	$('#tabs').tabs('destroy');
	$('#tabs').tabs();
}

ipcRenderer.on('clearWorlds', function (event, arg) {
	$('aside ul li.worldItem').remove();
	$('main div.worldItem').remove();
	redoTabs();
	tabCounter = 2;
});

ipcRenderer.on('gotWorld', function (event, worldNickName) {
	$('aside ul').append('<li class="worldItem"><a class="worlds" href="#tabs-' + tabCounter + '">[' + worldNickName + ']</a></li>');
	$('main').append('<div class="worldItem" id="tabs-' + tabCounter + '"></div>');
	tabCounter++;
	redoTabs();
});