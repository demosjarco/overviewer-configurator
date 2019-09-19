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
	dialog.showOpenDialog({ properties: ['openDirectory'] }, (filePaths) => {
		if (filePaths && filePaths.length > 0) {
			const path = filePaths[0].replace(/\\/g, "/");
			ipcRenderer.send('updateWorldsLocation', path);
			$('div#worldsLocation footer span').text(path);
		}
	});
}

ipcRenderer.on('gotMapsLocation', function (event, path) {
	$('div#saveLocation footer span').text(path ? path : 'Not yet selected');
});

function chooseMapsLocation() {
	dialog.showOpenDialog({ properties: ['openDirectory'] }, (filePaths) => {
		if (filePaths && filePaths.length > 0) {
			const path = filePaths[0].replace(/\\/g, "/");
			ipcRenderer.send('updateMapsLocation', path);
			$('div#saveLocation footer span').text(path);
		}
	});
}

const numSeconds = 60;

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
				label: 'CPU Core ' + (i + 1),
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
			tooltips: {
				enabled: false,
				mode: 'index',
				intersect: false,
				callbacks: {
					label: function (tooltipItem, data) {
						let label = data.datasets[tooltipItem.datasetIndex].label || '';

						if (label) {
							label += ': ';
						}
						label += Math.round(tooltipItem.yLabel * 100) / 100 + '%';
						return label;
					}
				}
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				xAxes: [{
					display: false,
				}],
				yAxes: [{
					display: true,
					ticks: {
						min: 0,
						max: 100
					},
					gridLines: {
						color: 'rgba(255, 255, 255, 0.19)'
					},
				}]
			},
			maintainAspectRatio: false,
		}
	};
	const graph = new Chart(graphCanvas, cpuGraphConfig);
	Chart.defaults.global.defaultColor = 'white';
	Chart.defaults.global.defaultFontColor = 'white';
	Chart.defaults.global.defaultFontFamily = "'Open Sans Condensed', sans-serif";

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
			tooltips: {
				enabled: false,
				mode: 'index',
				intersect: false,
				callbacks: {
					label: function (tooltipItem, data) {
						let label = data.datasets[tooltipItem.datasetIndex].label || '';

						if (label) {
							label += ': ';
						}
						label += Math.round(tooltipItem.yLabel * 100) / 100 + '%';
						return label;
					}
				}
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				xAxes: [{
					display: false,
				}],
				yAxes: [{
					display: true,
					ticks: {
						min: 0,
						max: 100
					},
					gridLines: {
						color: 'rgba(255, 255, 255, 0.19)'
					},
				}]
			},
			maintainAspectRatio: false,
		}
	};
	const graph = new Chart(graphCanvas, ramGraphConfig);
	Chart.defaults.global.defaultColor = 'white';
	Chart.defaults.global.defaultFontColor = 'white';
	Chart.defaults.global.defaultFontFamily = "'Open Sans Condensed', sans-serif";

	setInterval(function () {
		if (ramGraphConfig.data.datasets[0].data.length >= numSeconds) {
			ramGraphConfig.data.datasets[0].data.shift();
		}
		ramGraphConfig.data.datasets[0].data.push(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
		graph.update();
	}, 1000);
}