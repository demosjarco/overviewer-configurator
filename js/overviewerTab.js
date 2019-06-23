const os = require('os');
let numVisibleMessages = 25;
newVisualLog('Last ' + numVisibleMessages + ' messages will appear here');

ipcRenderer.send('getOverviewerVersion');
ipcRenderer.send('getLatestOverviewerVersion');

let cpuCores = '';
for (let i = 0; i < os.cpus().length; i++) {
	cpuCores += '<div id="cpuCore' + i + '"><div id="cpuCore' + i + '-t1" class="progressBar"><div class="progressBarInside"></div></div ><div id="cpuCore' + i + '-t2" class="progressBar"><div class="progressBarInside"></div></div><div id="cpuCore' + i + '-t3" class="progressBar"><div class="progressBarInside"></div></div><div id="cpuCore' + i + '-t4" class="progressBar"><div class="progressBarInside"></div></div><div id="cpuCore' + i + '-t5" class="progressBar"><div class="progressBarInside"></div></div></div >';
}
$(function () {
	$('body main div#tabs-1 div#cpu').append(cpuCores);
	cpuCores = null;

	$("body main div#tabs-1 #tabs1-content").tabs();
});

let initialCpuUsed = {};
let initialCpuTotal = {};
os.cpus().forEach(function (coreInfo, coreIndex) {
	initialCpuTotal[coreIndex] = 0;
	initialCpuUsed[coreIndex] = 0;
	Object.keys(coreInfo.times).forEach(function (type) {
		initialCpuTotal[coreIndex] += coreInfo.times[type];
		if (type != 'idle')
			initialCpuUsed[coreIndex] += coreInfo.times[type];
	});
});

setInterval(function () {
	os.cpus().forEach(function (coreInfo, coreIndex) {
		let total = 0;
		let used = 0;
		Object.keys(coreInfo.times).forEach(function (type) {
			total += coreInfo.times[type];
			if (type != 'idle')
				used += coreInfo.times[type];
		});
		$(function () {
			let cpuTime5 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t5 div.progressBarInside');
			let cpuTime4 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t4 div.progressBarInside');
			let cpuTime3 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t3 div.progressBarInside');
			let cpuTime2 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t2 div.progressBarInside');
			let cpuTime1 = $('body main div#tabs-1 div#cpu div#cpuCore' + coreIndex + ' div#cpuCore' + coreIndex + '-t1 div.progressBarInside');
			cpuTime5.css('height', cpuTime4.css('height'));
			cpuTime4.css('height', cpuTime3.css('height'));
			cpuTime3.css('height', cpuTime2.css('height'));
			cpuTime2.css('height', cpuTime1.css('height'));
			cpuTime1.css('height', (parseFloat((used - initialCpuUsed[coreIndex])) / parseFloat(total - initialCpuTotal[coreIndex])) * 100 + '%');
			cpuTime5 = cpuTime4 = cpuTime3 = cpuTime2 = cpuTime1 = null;
		});
	});
}, 1000);

setInterval(function () {
	$(function () {
		let ramTime5 = $('body main div#tabs-1 div#ram div#ramHistory div#ram5 div.progressBarInside');
		let ramTime4 = $('body main div#tabs-1 div#ram div#ramHistory div#ram4 div.progressBarInside');
		let ramTime3 = $('body main div#tabs-1 div#ram div#ramHistory div#ram3 div.progressBarInside');
		let ramTime2 = $('body main div#tabs-1 div#ram div#ramHistory div#ram2 div.progressBarInside');
		let ramTime1 = $('body main div#tabs-1 div#ram div#ramHistory div#ram1 div.progressBarInside');
		ramTime5.css('height', ramTime4.css('height'));
		ramTime4.css('height', ramTime3.css('height'));
		ramTime3.css('height', ramTime2.css('height'));
		ramTime2.css('height', ramTime1.css('height'));
		ramTime1.css('height', ((os.totalmem() - os.freemem()) / os.totalmem()) * 100 + '%');
		ramTime5 = ramTime4 = ramTime3 = ramTime2 = ramTime1 = null;
	});
}, 1000);

ipcRenderer.on('gotOverviewerVersion', function (event, version) {
	$(function () {
		$('body main div#tabs-1 table tbody tr td span#ovVersion').text(version);
	});
});
ipcRenderer.on('gotLatestOverviewerVersion', function (event, version) {
	$(function () {
		if (version == 'Error...') {
			$('body main div#tabs-1 table tbody tr td span#ovVersion').css('color', '#fff59d');
			$('body main div#tabs-1 table tbody tr td span#latestOvVersion').text(version).css('color', '#ef9a9a');
		} else {
			$('body main div#tabs-1 table tbody tr td span#latestOvVersion').text(version).css('color', '#a5d6a7');
			if ($('body main div#tabs-1 table tbody tr td span#ovVersion').text() == $('span#latestOvVersion').text()) {
				$('body main div#tabs-1 table tbody tr td span#ovVersion').css('color', '#a5d6a7');
			} else {
				$('body main div#tabs-1 table tbody tr td span#ovVersion').css('color', '#ef9a9a');
			}
		}
	});
});

function changeLogCount(newNumVisMessages) {
	numVisibleMessages = newNumVisMessages;
	if ($('body main div#tabs-1 div#tabs1-content #tabs1-2 ul li').length > numVisibleMessages)
		$('body main div#tabs-1 div#tabs1-content #tabs1-2 ul li').slice(numVisibleMessages - 1).remove();
}

ipcRenderer.on('visualLog', function (event, message) {
	newVisualLog(message);
});

function newVisualLog(message) {
	let tempDate = new Date();
	$(function () {
		$('body main div#tabs-1 div#tabs1-content #tabs1-2 ul').prepend('<li><span class="timeStamp">' + tempDate.toLocaleTimeString() + '</span><span class="message">' + message + '</span></li>');
		if ($('body main div#tabs-1 div#tabs1-content #tabs1-2 ul li').length > numVisibleMessages)
			$('body main div#tabs-1 div#tabs1-content #tabs1-2 ul li').slice(numVisibleMessages - 1).remove();
	});
}

function runOverviewer(runType) {
	ipcRenderer.send('runOverviewer', runType);
}

function stopOverviewer(runType) {
	ipcRenderer.send('stopOverviewer', runType);
}

ipcRenderer.on('overviewerRunProgress', function (event, runType, max = '0', current = '0') {
	$(function () {
		if ($('body main div#tabs-1 table tr.renderControl.' + runType + ' td progress').length == 0) {
			$('body main div#tabs-1 table tr.renderControl.' + runType + ' td button').text('Stop');
			$('body main div#tabs-1 table tr.renderControl.' + runType + ' td button').attr('onclick', "stopOverviewer('" + runType + "')");
			$('body main div#tabs-1 table tr.renderControl.' + runType).append('<td><progress></progress></td>');
		}
		if (parseInt(max) > 0 && max != current) {
			$('body main div#tabs-1 table tr.renderControl.' + runType + ' td progress').attr('max', max);
			$('body main div#tabs-1 table tr.renderControl.' + runType + ' td progress').attr('value', current);
		} else if (parseInt(max) > 0 && max == current) {
			$('body main div#tabs-1 table tr.renderControl.' + runType + ' td button').text('Start');
			$('body main div#tabs-1 table tr.renderControl.' + runType + ' td button').attr('onclick', "runOverviewer('" + runType + "')");
			$('body main div#tabs-1 table tr.renderControl.' + runType + ' td progress').closest('td').remove();
		}
	});
});