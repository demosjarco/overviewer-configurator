'use strict';

$(function () {
	setupMenu();
	refreshOverviewerVersions();
});

function refreshOverviewerVersions() {
	ipcRenderer.send('getOverviewerVersions');
	$('li#overviewer ul').empty().append('<li><div class="content"><span class="status"><i class="material-icons">cloud</i></span><span>Loading...</span></div></li>');
	/*ipcRenderer.on('readSetting_global_worldsLocation', function (event, value) {
		$(function () {
			$('.setting.global.worldsLocation').text(value);
		});
		ipcRenderer.send('readWorlds');
	});*/
	ipcRenderer.on('errorOverviewerVersions', function (event, message) {
		$('li#overviewer ul').append('<li class="error"><div class="content"><span class="status"><i class="material-icons">error</i></span><span>' + message + '</span></div></li>');
	});
	setupMenu();
}

function setupMenu() {
	$('li.allowed').has('ul').off().click(function () {
		$(this).toggleClass('open');
	}).find('li').off().click(function (e) {
		e.stopPropagation();
	});
}