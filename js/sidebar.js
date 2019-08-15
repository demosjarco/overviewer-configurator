'use strict';

$(function () {
	setupMenu();
	refreshOverviewerVersions();
});

function setupMenu() {
	$('li.allowed').off().click(function () {
		$(this).toggleClass('selected');
	}).has('ul').click(function () {
		$(this).toggleClass('open');
	}).find('li').off().click(function (e) {
		e.stopPropagation();
	});
}

function refreshOverviewerVersions() {
	$('li#overviewer ul').empty().append('<li class="loading"><div class="content"><span class="status"><i class="material-icons">autorenew</i></span><span>Loading...</span></div></li>');
	ipcRenderer.send('getOverviewerVersions');
	ipcRenderer.send('getLocalOverviewerVersion');
}

let installedVersion = '';
ipcRenderer.on('localOverviewerVersion', function (event, currentVersion) {
	installedVersion = currentVersion;
	$('li#overviewer ul li div.content span.status i.material-icons:contains(cloud_done)').text('cloud_download');
	$('li#overviewer ul li.v' + currentVersion.replace(/\./g, '_') + ' div.content span.status i.material-icons').text('cloud_done');
});
ipcRenderer.on('newOverviewerVersions', function (event, version, url) {
	let newVersion = $('<li class="v' + version.replace(/\./g, '_') + '"><div class="content"><span class="status"><i class="material-icons">' + (installedVersion == version ? 'cloud_done' : 'cloud_download') + '</i></span><span>' + version + '</span></div></li>');
	$('li#overviewer ul').append(newVersion);
	newVersion.click(function (e) {
		e.stopPropagation();
		ipcRenderer.send('updateOverviewerVersion', url);
	});
});
ipcRenderer.on('doneOverviewerVersions', function (event, version, url) {
	$('li#overviewer ul').find('li.loading').remove();
});
ipcRenderer.on('errorOverviewerVersions', function (event, message) {
	$('li#overviewer ul').append('<li class="error"><div class="content"><span class="status"><i class="material-icons">error</i></span><span>' + message + '</span></div></li>');
});

ipcRenderer.on('progressOverviewerVersion', function (event, visible, version, progress = 0.00) {
	if (visible) {
		$('li#overviewer ul li.v' + version.replace(/\./g, '_') + ' div.content').not(':has(div.progressBar)').append('<div class="progressBar"><div class="status"></div></div>');
		$('li#overviewer ul li.v' + version.replace(/\./g, '_') + ' div.content div.progressBar div.status').css('width', (progress * 100) + '%');
	} else {
		$('li#overviewer ul li.v' + version.replace(/\./g, '_') + ' div.content div.progressBar').remove();
	}
});