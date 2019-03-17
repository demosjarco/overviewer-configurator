let tabCounter = 2;

function redoTabs() {
	$('#tabs').tabs('destroy');
	$('#tabs').tabs();
	$('aside ul li a').height($(window).width() * 0.0375);
	$('aside ul li a').css('line-height', ($(window).width() * 0.0375) + 'px');
}

ipcRenderer.on('clearWorlds', function (event, arg) {
	$('aside ul li.worldItem').remove();
	$('main div.worldItem').remove();
	redoTabs();
	tabCounter = 2;
});

ipcRenderer.on('gotWorld', function (event, worldNickName, worldName, worldPath) {
	$('aside ul').append('<li class="worldItem"><a class="worlds" href="#tabs-' + tabCounter + '">[' + worldNickName + ']</a></li>');
	$('main').append('<div class="worldItem" id="tabs-' + tabCounter + '"><h2>[' + worldNickName + '] ' + worldName + '</h2><table><tr><td>Path:</td><td><pre>' + worldPath + '</pre></td></tr></table><h3>Render Directions</h3><hr /><p></p><span>Upper Left</span><span>Upper Right</span><span>Lower Left</span><span>Lower Right</span><h3>Render Types</h3><hr /><p></p><h3>Rerender</h3><hr /><p></p></div>');
	tabCounter++;
	redoTabs();
});