'use strict';

$(function () {
	setupGraphs();
});

function setupGraphs() {
	cpuGraph($('canvas#cpuGraph'));
	ramGraph($('canvas#ramGraph'));
}

function getColor() {
	return "hsl(" + 360 * Math.random() + ',' + (25 + 70 * Math.random()) + '%,' + (45 + 10 * Math.random()) + '%)';
}

const os = require('os');
function cpuGraph(graphCanvas) {
	let cpuCoresDatasets = [];
	for (let i = 0; i < os.cpus().length; i++) {
		let colorChosen = getColor();
		cpuCoresDatasets.push({
			label: 'CPU Core ' + (i+1),
			backgroundColor: colorChosen,
			borderColor: colorChosen,
			data: [],
			fill: false,
		});
	}
	let cpuGraphConfig = {
		type: 'line',
		data: {
			labels: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
			datasets: cpuCoresDatasets
		},
		options: {
			tooltips: {
				mode: 'index',
				intersect: false,
				callbacks: {
					label: function (tooltipItem, data) {
						var label = data.datasets[tooltipItem.datasetIndex].label || '';

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
					}
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
			if (cpuGraphConfig.data.datasets[coreIndex].data.length >= 10) {
				cpuGraphConfig.data.datasets[coreIndex].data.shift();
			}
			cpuGraphConfig.data.datasets[coreIndex].data.push((parseFloat((used - initialCpuUsed[coreIndex])) / parseFloat(total - initialCpuTotal[coreIndex])) * 100);
			graph.update();
		});
	}, 1000);
}

function ramGraph(graphCanvas) {
	let colorChosen = getColor();
	let ramGraphConfig = {
		type: 'line',
		data: {
			labels: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
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
				mode: 'index',
				intersect: false,
				callbacks: {
					label: function (tooltipItem, data) {
						var label = data.datasets[tooltipItem.datasetIndex].label || '';

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
					}
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
		if (ramGraphConfig.data.datasets[0].data.length >= 10) {
			ramGraphConfig.data.datasets[0].data.shift();
		}
		ramGraphConfig.data.datasets[0].data.push(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
		graph.update();
	}, 1000);
}