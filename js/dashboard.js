'use strict';

$(function () {
	setupGraphs();
});

function setupGraphs() {
	cpuGraph($('canvas#cpuGraph'));
}

var color, letters = '0123456789ABCDEF'.split('')
function AddDigitToColor(limit) {
	color += letters[Math.round(Math.random() * limit)]
}
function getRandomColor() {
	color = '#'
	AddDigitToColor(5)
	for (var i = 0; i < 5; i++) {
		AddDigitToColor(13)
	}
	return color
}

function cpuGraph(graphCanvas) {
	const os = require('os');
	let cpuGraphConfig = {};
	let cpuCoresDatasets = [];
	for (let i = 0; i < os.cpus().length; i++) {
		let colorChosen = getRandomColor();
		cpuCoresDatasets.push({
			label: 'CPU Core ' + (i+1),
			backgroundColor: colorChosen,
			borderColor: colorChosen,
			data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			fill: false,
		});
	}
	cpuGraphConfig = {
		type: 'line',
		data: {
			labels: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
			datasets: cpuCoresDatasets
		},
		options: {
			tooltips: {
				mode: 'index',
				intersect: false,
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				xAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Seconds',
					}
				}],
				yAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: '% Usage',
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
			cpuGraphConfig.data.datasets[coreIndex].data.shift();
			cpuGraphConfig.data.datasets[coreIndex].data.push((parseFloat((used - initialCpuUsed[coreIndex])) / parseFloat(total - initialCpuTotal[coreIndex])) * 100);
			graph.update();
		});
	}, 1000);
}