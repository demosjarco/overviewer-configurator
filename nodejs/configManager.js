'use strict';

const { app } = require('electron');
const fs = require('fs');

const configPath = app.getPath('userData').replace(/\\/g, "/") + '/config.py';
let saveQueue = [];
let saveQueueProcessing = false;

String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

module.exports = class ConfigManager {
	constructor() {
		fs.access(configPath, fs.constants.F_OK | fs.constants.W_OK, (err) => {
			if (err) {
				if (err.code === 'ENOENT') {
					saveQueue.push({ timestamp: new Date() });
					if (saveQueue.length > 0 && !saveQueueProcessing) {
						processSaveQueue();
					}
				} else {
					throw err;
				}
			}
		});
	}

	updateConfig(json) {
		saveQueue.push({ timestamp: new Date(), content: json });
		if (saveQueue.length > 0 && !saveQueueProcessing) {
			processSaveQueue();
		}
	}
}

function processSaveQueue() {
	saveQueueProcessing = true;
	let info = saveQueue.shift();

	fs.writeFile(configPath, createPyConfigFile(info.timestamp, info.content), (err) => {
		if (err) throw err;

		if (saveQueue.length > 0) {
			processSaveQueue();
		} else {
			saveQueueProcessing = false;
		}
	});
}

function createPyConfigFile(timestamp = new Date(), permJson = {}) {
	let overviewerConfigFile = '# Created on ' + timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString() + ' with Overviewer Config v' + require('../package.json').version + '\n';
	overviewerConfigFile += '\n';

	overviewerConfigFile += worldsSection(permJson.worlds);

	overviewerConfigFile += globalConfig(permJson.global);

	overviewerConfigFile += markersConfig(permJson.markers);

	overviewerConfigFile += renderConfig(permJson.worlds);

	return overviewerConfigFile;
}

function worldsSection(worlds = {}) {
	let worldsString = '#\t\tWorlds Setup\n';
	if (worlds.length > 0) {
		worlds.forEach(function (worldInfo) {
			if (worldInfo.enabled)
				worldsString += 'worlds["' + worldInfo.name + '"] = "' + worldInfo.path + '"\n';
		});
	}
	worldsString += '\n';
	return worldsString;
}

function globalConfig(global = {}) {
	let globalsString = '#\t\tGlobal Config\n';

	if (global && global.outputLocation)
		globalsString += 'outputdir = "' + global.outputLocation + '"\n';
	//globalsString += 'customwebassets = "../web_assets"\n';
	globalsString += 'bgcolor = "#000000"\n';
	if (global && global.caveDepthShading) {
		globalsString += 'custom_cave = "cave"\n';
	} else {
		globalsString += 'custom_cave = [Base(), EdgeLines(), Cave()]\n';
	}
	if (global && global.lighterNetherShading) {
		globalsString += 'custom_nether_lighting = [Base(), EdgeLines(), Nether(), Lighting(strength=0.5)]\n';
		globalsString += 'custom_nether_smooth_lighting = [Base(), EdgeLines(), Nether(), SmoothLighting(strength=0.5)]\n';
	} else {
		globalsString += 'custom_nether_lighting = "nether_lighting"\n';
		globalsString += 'custom_nether_smooth_lighting = "nether_smooth_lighting"\n';
	}
	if (global && global.lighterEndShading) {
		globalsString += 'custom_end_lighting = [Base(), EdgeLines(), Lighting(strength=0.5)]\n';
		globalsString += 'custom_end_smooth_lighting = [Base(), EdgeLines(), SmoothLighting(strength=0.5)]\n';
	} else {
		globalsString += 'custom_end_lighting = [Base(), EdgeLines(), Lighting()]\n';
		globalsString += 'custom_end_smooth_lighting = [Base(), EdgeLines(), SmoothLighting()]\n';
	}
	globalsString += '\n';

	// Progress
	if (global && global.renderProgress) {
		globalsString += '#\t\tProgress\n';

		if (global.renderProgress.local && global.renderProgress.web) {
			globalsString += 'from .observer import MultiplexingObserver, LoggingObserver, JSObserver\n';
			globalsString += 'observer = MultiplexingObserver(LoggingObserver(), JSObserver(outputdir, 10))\n';
		} else if (global.renderProgress.web) {
			globalsString += 'from .observer import JSObserver\n';
			globalsString += 'observer = JSObserver(outputdir, 10)\n';
		} else if (global.renderProgress.local) {
			globalsString += 'from .observer import LoggingObserver\n';
			globalsString += 'observer = LoggingObserver()\n';
		}
		globalsString += '\n';
	}

	// Image Settings
	if (global && global.imageSettings) {
		globalsString += '#\t\tImage Settings\n';

		if (global.imageSettings.format) {
			globalsString += 'imgformat = "' + global.imageSettings.format + '"\n';

			switch (global.imageSettings.format) {
				case 'png':
					if (require('command-exists').sync('oxipng')) {
						globalsString += 'from .optimizeimages import oxipng\n';
						globalsString += 'optimizeimg = [oxipng(olevel=' + global.imageSettings.png.compressionLevel + ')]\n';
					}
					break;
				case 'jpg':
					globalsString += 'imgquality = ' + global.imageSettings.jpg.imgquality + '\n';
					if (require('command-exists').sync('jpegoptim')) {
						globalsString += 'from .optimizeimages import jpegoptim\n';
						globalsString += 'optimizeimg = [jpegoptim(quality=' + global.imageSettings.jpg.imgquality + ')]\n';
					}
					break;
				case 'webp':
					globalsString += 'imgquality = ' + global.imageSettings.webp.compressionLevel + '\n';
					globalsString += 'imglossless = ' + (global.imageSettings.webp.imglossless ? 'True' : 'False') + '\n';
					break;
			}
		}
		globalsString += '\n';
	}

	return globalsString;
}

function markersConfig(markers = {}) {
	let markersString = '#\t\tMarkers Config\n';
	const defRegex = /(?<=^def\s)(\w|\d)+(?=\()/i;

	Object.keys(markers).map(function (key, index) {
		if (markers[key].customFilterFunction) {
			markersString += markers[key].customFilterFunction + '\n\n';
			markersString += key + 'Filter = dict(name="' + markers[key].name + '", filterFunction=' + defRegex.exec(markers[key].customFilterFunction)[0] + (markers[key].icon ? ', icon="' + markers[key].icon + '"' : '') + ', createInfoWindow=' + (markers[key].createInfoWindow ? 'True' : 'False') + ', checked=' + (markers[key].checked ? 'True' : 'False') + ')\n\n';
		}
	});

	return markersString;
}

function renderConfig(worlds = {}) {
	let renderString = '#\t\tWorld Render Config\n';

	for (const worldKey in worlds) {
		const worldInfo = worlds[worldKey];

		if (worldInfo.enabled) {
			renderString += `##\t\t${worldInfo.name}\n`;

			function getDirection(directionKey) {
				switch (directionKey) {
					case "ul":
						return "upper-left";
					case "ur":
						return "upper-right";
					case "ll":
						return "lower-left";
					case "lr":
						return "lower-right";
				}
			}

			for (const renderTypeKey in worldInfo.renderTypes) {
				const renderType = worldInfo.renderTypes[renderTypeKey];

				if (renderType.enabled) {
					renderString += `###\t\t${renderTypeKey.capitalize()}\n`;

					for (const directionKey in renderType.directions) {
						const directionEnabled = renderType.directions[directionKey];

						if (directionEnabled) {
							renderString += `####\t${directionKey.toUpperCase()}\n`;

							function getDimension() {
								switch (renderTypeKey) {
									case "nether":
										return "nether";
									case "end":
										return "end";
								}
							}

							function getRenderQuality() {
								switch (renderTypeKey) {
									case "day":
										if (renderType.smoothLighting) {
											return `"smooth_lighting"`;
										} else {
											return `"lighting"`;
										}
									case "caves":
										return "custom_cave";
									case "night":
										if (renderType.smoothLighting) {
											return `"smooth_night"`;
										} else {
											return `"night"`;
										}
									case "nether":
										if (renderType.smoothLighting) {
											return "custom_nether_smooth_lighting";
										} else {
											return "custom_nether_lighting";
										}
									case "end":
										if (renderType.smoothLighting) {
											return "custom_end_smooth_lighting";
										} else {
											return "custom_end_lighting";
										}
								}
							}

							let markerList = [];
							for (const markerTypeKey in renderType.markers) {
								if (renderType.markers[markerTypeKey]) {
									switch (markerTypeKey) {
										case "sign":
											markerList.push("signsFilter");
											break;
										case "chest":
											markerList.push("chestsFilter");
											break;
										case "player":
											markerList.push("playersFilter");
											break;
									}
								}
							}

							renderString += `renders["${worldInfo.sc}-${renderTypeKey}-${directionKey}"] = {\n`;
							renderString += `\t"world": "${worldInfo.name}",\n`;
							renderString += `\t"title": "${renderTypeKey.capitalize()} ${directionKey.toUpperCase()}",\n`;
							if (renderTypeKey == "nether" || renderTypeKey == "end") {
								renderString += `\t"dimension": "${getDimension()}",\n`;
							}
							renderString += `\t"rendermode": ${getRenderQuality()},\n`;
							renderString += `\t"northdirection": "${getDirection(directionKey)}",\n`;
							if (renderType.markers) {
								renderString += `\t"markers": [${markerList}]\n`;
							}
							renderString += `}\n`;
						}
					}
				}
			}

			for (const overlayTypeKey in worldInfo.overlayTypes) {
				const overlayType = worldInfo.overlayTypes[overlayTypeKey];

				if (Object.values(overlayType).some((e) => { return e; })) {
					renderString += `###\t\t${overlayTypeKey.capitalize()}\n`;
					let directionsToRender = {
						"ul": [],
						"ur": [],
						"ll": [],
						"lr": []
					};

					for (const renderTypeKey in overlayType) {
						const renderTypeEnabled = overlayType[renderTypeKey];
						
						for (const directionKey in worldInfo.renderTypes[renderTypeKey].directions) {
							if (worldInfo.renderTypes[renderTypeKey].directions[directionKey]) {
								directionsToRender[directionKey].push(`${worldInfo.sc}-${renderTypeKey}-${directionKey}`);
							}
						}
					}

					for (const directionKey in directionsToRender) {
						const directionEnabled = directionsToRender[directionKey];

						if (directionEnabled.length > 0) {
							renderString += `####\t${directionKey.toUpperCase()}\n`;

							renderString += `renders["${worldInfo.sc}-${overlayTypeKey}-${directionKey}"] = {\n`;
							renderString += `\t"world": "${worldInfo.name}",\n`;
							renderString += `\t"title": "${overlayTypeKey.capitalize()} ${directionKey.toUpperCase()}",\n`;
							renderString += `\t"rendermode": [ClearBase(), MineralOverlay()],\n`;
							renderString += `\t"northdirection": "${getDirection(directionKey)}",\n`;
							renderString += `\t"overlay": ${JSON.stringify(directionEnabled)},\n`;
							renderString += `}\n`;
						}
					}
				}
			}
		}
	}

	return renderString;
}