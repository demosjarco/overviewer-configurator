'use strict';

$(function () {
	ipcRenderer.send('getWorldsLocation');
	ipcRenderer.send('getMapsLocation');
	setupGraphs();
});

let overviewerRunning = {
	map: false,
	poi: false,
	webass: false
};

ipcRenderer.on('overviewerRunProgress', function (event, renderType = '', renderProgress = 100.0) {
	if (renderProgress != 100.0) {
		overviewerRunning[renderType] = true;
	} else {
		overviewerRunning[renderType] = false;
	}

	$('button.progress.' + renderType + ' span.bar').css('width', renderProgress + '%');
});

function runOverviewer(runType) {
	if (overviewerRunning[runType]) {
		ipcRenderer.send('stopOverviewer', runType);
	} else {
		ipcRenderer.send('runOverviewer', runType);
	}
}

ipcRenderer.on('gotWorldsLocation', function (event, path) {
	$('div#worldsLocation footer span').text(path ? path : 'Not yet selected');
});

function chooseWorldsLocation() {
	dialog.showOpenDialog({ properties: ['openDirectory'] }).then((result) => {
		console.log(result);
		if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
			const path = result.filePaths[0].replace(/\\/g, "/");
			ipcRenderer.send('updateWorldsLocation', path);
			$('div#worldsLocation footer span').text(path);
			$('li#worlds ul').empty().append('<li class="loading"><div class="content"><span class="status"><i class="material-icons">autorenew</i></span><span>Loading...</span></div></li>');
			ipcRenderer.send('readWorlds', path);
		}
	}).catch((err) => {
		ipcRenderer.send('visualLog', err);
		console.error(err);
	});
}

ipcRenderer.on('gotMapsLocation', function (event, path) {
	$('div#saveLocation footer span').text(path ? path : 'Not yet selected');
});

function chooseMapsLocation() {
	dialog.showOpenDialog({ properties: ['openDirectory'] }).then((result) => {
		console.log(result);
		if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
			const path = result.filePaths[0].replace(/\\/g, "/");
			ipcRenderer.send('updateMapsLocation', path);
			$('div#saveLocation footer span').text(path);
		}
	}).catch((err) => {
		ipcRenderer.send('visualLog', err);
		console.error(err);
	});
}

const numSeconds = 30;

function setupGraphs() {
	cpuGraph($('canvas#cpuGraph'));
	$('div#cpu footer p span span.duration').text(numSeconds);
	ramGraph($('canvas#ramGraph'));
	$('div#ram footer p span span.duration').text(numSeconds);
}

function getColor() {
	return "hsl(" + 360 * Math.random() + ',' + (25 + 70 * Math.random()) + '%,' + (60 + 10 * Math.random()) + '%)';
}

function setDatasetLabels() {
	let datasetLabels = [];
	for (let i = 0; i < numSeconds; i++) {
		datasetLabels.push('' + (i + 1));
	}
	return datasetLabels;
}

const os = require('os');
function cpuGraph(graphCanvas) {
	function setupDatasets() {
		let cpuCoresDatasets = [];
		for (let i = 0; i < os.cpus().length; i++) {
			const colorChosen = getColor();
			cpuCoresDatasets.push({
				label: 'CPU Core ' + i,
				backgroundColor: colorChosen,
				borderColor: colorChosen,
				data: [],
				fill: false,
			});
		}
		return cpuCoresDatasets;
	}

	let cpuGraphConfig = {
		type: 'line',
		data: {
			labels: setDatasetLabels(),
			datasets: setupDatasets()
		},
		options: {
			plugins: {
				tooltip: {
					callbacks: {
						label: (context) => {
							return `${context.parsed.y.toFixed(2)}%`;
						}
					}
				}
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				x: {
					display: false,
				},
				y: {
					display: true,
					min: 0,
					max: 100,
					grid: {
						color: 'rgba(255, 255, 255, 0.19)'
					}
				},
				
			},
			maintainAspectRatio: false,
		}
	};
	
	const graph = new Chart(graphCanvas, cpuGraphConfig);
	Chart.defaults.backgroundColor = 'white';
	Chart.defaults.borderColor = 'white';
	Chart.defaults.color = 'white';
	Chart.defaults.font.family = "'Open Sans Condensed', sans-serif";

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
			if (cpuGraphConfig.data.datasets[coreIndex].data.length >= numSeconds) {
				cpuGraphConfig.data.datasets[coreIndex].data.shift();
			}
			cpuGraphConfig.data.datasets[coreIndex].data.push((parseFloat((used - initialCpuUsed[coreIndex])) / parseFloat(total - initialCpuTotal[coreIndex])) * 100);
			graph.update();
		});
	}, 1000);
}

function ramGraph(graphCanvas) {
	const colorChosen = getColor();
	let ramGraphConfig = {
		type: 'line',
		data: {
			labels: setDatasetLabels(),
			datasets: [{
				label: 'RAM Usage',
				backgroundColor: colorChosen,
				borderColor: colorChosen,
				data: [],
				fill: false,
			}]
		},
		options: {
			plugins: {
				tooltip: {
					callbacks: {
						label: (context) => {
							return `${context.parsed.y.toFixed(2)}%`;
						}
					}
				}
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				x: {
					display: false,
				},
				y: {
					display: true,
					min: 0,
					max: os.totalmem() / 1024 / 1024 / 1024, // bytes / kb / mb / gb
					grid: {
						color: 'rgba(255, 255, 255, 0.19)',
					}
				},

			},
			maintainAspectRatio: false,
		}
	};
	const graph = new Chart(graphCanvas, ramGraphConfig);
	Chart.defaults.borderColor = 'white';
	Chart.defaults.color = 'white';
	Chart.defaults.font.family = "'Open Sans Condensed', sans-serif";

	setInterval(function () {
		if (ramGraphConfig.data.datasets[0].data.length >= numSeconds) {
			ramGraphConfig.data.datasets[0].data.shift();
		}
		ramGraphConfig.data.datasets[0].data.push((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024); // (used bytes) / kb / mb / gb
		graph.update();
	}, 1000);
}