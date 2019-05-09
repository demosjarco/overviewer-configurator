const os = require('os');
let numVisibleMessages = 25;

$(document).ready(function () {
	ipcRenderer.send('getOverviewerVersion');
	ipcRenderer.send('getLatestOverviewerVersion');

	let cpuCores = '';
	for (let i = 0; i < os.cpus().length; i++) {
		cpuCores += '<div id="cpuCore' + i + '"><div id="cpuCore' + i + '-t1" class="progressBar"><div class="progressBarInside"></div></div ><div id="cpuCore' + i + '-t2" class="progressBar"><div class="progressBarInside"></div></div><div id="cpuCore' + i + '-t3" class="progressBar"><div class="progressBarInside"></div></div><div id="cpuCore' + i + '-t4" class="progressBar"><div class="progressBarInside"></div></div><div id="cpuCore' + i + '-t5" class="progressBar"><div class="progressBarInside"></div></div></div >';
	}
	$('body main div#tabs-1 div#cpu').append(cpuCores);
	cpuCores = null;

	setInterval(function () {
		os.cpus().forEach(function (coreInfo, coreIndex) {
			let total = 0;
			let used = 0;
			Object.keys(coreInfo.times).forEach(function (type) {
				total += coreInfo.times[type];
				if (type != 'idle')
					used += coreInfo.times[type];
			});
			let time5 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t5 div.progressBarInside');
			let time4 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t4 div.progressBarInside');
			let time3 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t3 div.progressBarInside');
			let time2 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t2 div.progressBarInside');
			let time1 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t1 div.progressBarInside');
			time5.css('height', time4.css('height'));
			time4.css('height', time3.css('height'));
			time3.css('height', time2.css('height'));
			time2.css('height', time1.css('height'));
			time1.css('height', (used / total) * 100 + '%');
			time5 = time4 = time3 = time2 = time1 = null;
		});

		let time5 = $('body main div#tabs-1 div#ram div#ramHistory div#ram5 div.progressBarInside');
		let time4 = $('body main div#tabs-1 div#ram div#ramHistory div#ram4 div.progressBarInside');
		let time3 = $('body main div#tabs-1 div#ram div#ramHistory div#ram3 div.progressBarInside');
		let time2 = $('body main div#tabs-1 div#ram div#ramHistory div#ram2 div.progressBarInside');
		let time1 = $('body main div#tabs-1 div#ram div#ramHistory div#ram1 div.progressBarInside');
		time5.css('height', time4.css('height'));
		time4.css('height', time3.css('height'));
		time3.css('height', time2.css('height'));
		time2.css('height', time1.css('height'));
		time1.css('height', ((os.totalmem() - os.freemem()) / os.totalmem()) * 100 + '%');
		time5 = time4 = time3 = time2 = time1 = null;
	}, 1000);

	$("body main div#tabs-1 #tabs1-content").tabs();

	newVisualLog('Last ' + numVisibleMessages + ' messages will appear here');
});

ipcRenderer.on('gotOverviewerVersion', function (event, version) {
	$('span#ovVersion').text(version);
});
ipcRenderer.on('gotLatestOverviewerVersion', function (event, version) {
	$('span#latestOvVersion').text(version).css('color', '#a5d6a7');
	if ($('span#ovVersion').text() == $('span#latestOvVersion').text()) {
		$('span#ovVersion').css('color', '#a5d6a7');
	} else {
		$('span#ovVersion').css('color', '#ef9a9a');
	}
});

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