const { ipcRenderer } = require('electron');
const si = require('systeminformation');

$(document).ready(function () {
	$("#tabs1-content").tabs();

	ipcRenderer.send('getOverviewerVersion');
	ipcRenderer.send('getLatestOverviewerVersion');

	setInterval(function () {
		si.cpuCurrentspeed().then(data => {
			$('div#cpuHistory div#cpu5 div.progressBarInside').css('height', $('div#cpuHistory div#cpu4 div.progressBarInside').css('height'));
			$('div#cpuHistory div#cpu4 div.progressBarInside').css('height', $('div#cpuHistory div#cpu3 div.progressBarInside').css('height'));
			$('div#cpuHistory div#cpu3 div.progressBarInside').css('height', $('div#cpuHistory div#cpu2 div.progressBarInside').css('height'));
			$('div#cpuHistory div#cpu2 div.progressBarInside').css('height', $('div#cpuHistory div#cpu1 div.progressBarInside').css('height'));
			$('div#cpuHistory div#cpu1 div.progressBarInside').css('height', data.avg + '%');
		});

		si.mem().then(data => {
			$('div#ramHistory div#ram5 div.progressBarInside').css('height', $('div#ramHistory div#ram4 div.progressBarInside').css('height'));
			$('div#ramHistory div#ram4 div.progressBarInside').css('height', $('div#ramHistory div#ram3 div.progressBarInside').css('height'));
			$('div#ramHistory div#ram3 div.progressBarInside').css('height', $('div#ramHistory div#ram2 div.progressBarInside').css('height'));
			$('div#ramHistory div#ram2 div.progressBarInside').css('height', $('div#ramHistory div#ram1 div.progressBarInside').css('height'));
			$('div#ramHistory div#ram1 div.progressBarInside').css('height', (data.active / data.total) * 100 + '%');
		});
	}, 1000);

	newVisualLog('Last ' + numVisibleMessages + ' messages will appear here');
});

ipcRenderer.on('gotOverviewerVersion', function (event, version) {
	$('span#ovVersion').text(version);
});
ipcRenderer.on('gotLatestOverviewerVersion', function (event, version) {
	$('span#latestOvVersion').text(version);
	$('span#latestOvVersion').css('color', '#a5d6a7');
	if ($('span#ovVersion').text() == $('span#latestOvVersion').text()) {
		$('span#ovVersion').css('color', '#a5d6a7');
	} else {
		$('span#ovVersion').css('color', '#ef9a9a');
	}
});

let numVisibleMessages = 25;

function changeLogCount(newNumVisMessages) {
	numVisibleMessages = newNumVisMessages;
	if ($('#tabs1-2 ul li').length > numVisibleMessages)
		$('#tabs1-2 ul li').slice(numVisibleMessages - 1).remove();
}

ipcRenderer.on('visualLog', function (event, message) {
	newVisualLog(message);
});

function newVisualLog(message) {
	let tempDate = new Date();
	$('#tabs1-2 ul').prepend('<li><span class="timeStamp">' + tempDate.toLocaleTimeString() + '</span><span class="message">' + message + '</span></li>');
	if ($('#tabs1-2 ul li').length > numVisibleMessages)
		$('#tabs1-2 ul li').slice(numVisibleMessages - 1).remove();
}