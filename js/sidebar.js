'use strict';

$(function () {
	setupMenu();
	refreshOverviewerVersions();
});

function refreshOverviewerVersions() {
	ipcRenderer.send('getLocalOverviewerVersion');
	ipcRenderer.on('localOverviewerVersion', function (event, currentVersion) {
		console.log(currentVersion);
	});
	ipcRenderer.send('getOverviewerVersions');
	$('li#overviewer ul').empty().append('<li class="loading"><div class="content"><span class="status"><i class="material-icons">autorenew</i></span><span>Loading...</span></div></li>');
	ipcRenderer.on('newOverviewerVersions', function (event, version, url) {
		$('li#overviewer ul').append('<li><div class="content"><span class="status"><i class="material-icons">cloud_download</i></span><span>' + version + '</span></div></li>');
	});
	ipcRenderer.on('doneOverviewerVersions', function (event, version, url) {
		$('li#overviewer ul').find('li.loading').remove();
	});
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