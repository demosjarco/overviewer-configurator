'use strict';

$(function () {
	setupMenu();
	refreshOverviewerVersions();
	refreshWorlds();
});

function setupMenu() {
	$('li.allowed').off().has('ul').click(function () {
		$(this).toggleClass('selected');
		$(this).toggleClass('open');
		if ($(this).hasClass('open')) {
			$(this).find('i.material-icons:contains(arrow_drop_down)').text('arrow_drop_up');
		} else {
			$(this).find('i.material-icons:contains(arrow_drop_up)').text('arrow_drop_down');
		}
	}).find('li').off().click(function (e) {
		e.stopPropagation();
	});
	$('li.allowed').not(':has(ul)').click(function () {
		$(this).addClass('selected');
		$('li.allowed').not(':has(ul)').not(this).removeClass('selected');
	});
	$('li.allowed.tab').click(function () {
		$('div.tab').removeClass('selected');
	});
	$('li.allowed.tab.dashboard').click(function () {
		$('div.tab.dashboard').addClass('selected');
	});
	$('li.allowed.tab.global').click(function () {
		$('div.tab.global').addClass('selected');
	});
	$('li.allowed.tab.pois').click(function () {
		$('div.tab.pois').addClass('selected');
	});
	$('li.allowed.tab.logs').click(function () {
		$('div.tab.logs').addClass('selected');
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
ipcRenderer.on('newOverviewerVersions', function (event, version, url, changeMessage) {
	let newVersion = $('<li class="allowed v' + version.replace(/\./g, '_') + '"><div class="content" title="' + (changeMessage ? changeMessage : '') + '"><span class="status"><i class="material-icons">' + (installedVersion == version ? 'cloud_done' : 'cloud_download') + '</i></span><span>' + version + '</span></div></li>');
	$('li#overviewer ul').append(newVersion);
	newVersion.click(function (e) {
		e.stopPropagation();
		ipcRenderer.send('updateOverviewerVersion', url);
	});
});
ipcRenderer.on('doneOverviewerVersions', function (event) {
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

function refreshWorlds() {
	$('li#worlds ul').empty().append('<li class="loading"><div class="content"><span class="status"><i class="material-icons">autorenew</i></span><span>Loading...</span></div></li>');
	ipcRenderer.send('readWorlds');
}
ipcRenderer.on('foundWorld', function (event, worldInfo) {
	console.log(worldInfo);
	let newWorld = $('<li class="allowed"><div class="content" title="' + worldInfo.name + '"><span class="worldCode">' + worldInfo.sc + '</span><span class="worldTitle">' + worldInfo.name + '</span></div></li>');
	$('li#worlds ul').append(newWorld);
});
ipcRenderer.on('doneWorlds', function (event) {
	$('li#worlds ul').find('li.loading').remove();
});