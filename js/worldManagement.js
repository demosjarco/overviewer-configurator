let tabCounter = 2;

function redoTabs() {
	$('#tabs').tabs('destroy');
	$('#tabs').tabs();
	$('aside ul li a').height($(window).width() * 0.0375);
	$('aside ul li a').css('line-height', ($(window).width() * 0.0375) + 'px');
}

ipcRenderer.on('clearWorlds', function (event, arg) {
	$('aside ul li.worldItem').remove();
	$('main div.worldItem').remove();
	redoTabs();
	tabCounter = 2;
});

ipcRenderer.on('gotWorld', function (event, worldNickName, worldName, worldPath) {
	$('aside ul').append('<li class="worldItem"><a class="worlds" href="#tabs-' + tabCounter + '">[' + worldNickName + ']</a></li>');
	$('main').append('<div class="worldItem ' + worldNickName + '" id="tabs-' + tabCounter + '"><h2>[' + worldNickName + '] ' + worldName + '</h2><table><tr><td>Path:</td><td><pre>' + worldPath + '</pre></td></tr></table><div class="directions"><div onclick="selectedRenderDirection(\'' + worldNickName + '\', \'ul\')" class="direction ul selected"></div><div onclick="selectedRenderDirection(\'' + worldNickName + '\', \'ur\')" class="direction ur"></div><div onclick="selectedRenderDirection(\'' + worldNickName + '\', \'lr\')" class="direction lr"></div><div onclick="selectedRenderDirection(\'' + worldNickName + '\', \'ll\')" class="direction ll"></div></div><h3>Render Types</h3><hr /><input type="checkbox" class="day enable" onchange="selectedRenderType(\'' + worldNickName + '\', \'day\', this.checked)" /><details><summary>Day</summary><p>A render with per-block lighting, which looks similar to Minecraft without smooth lighting turned on. This is slightly slower than the normal mode.</p><p><input type="checkbox" class="day smoothLighting" onchange="selectedRenderType(\'' + worldNickName + '\', \'day\', null, this.checked)" />Smooth Lighting</p><select class="day renderType" onchange="selectedRenderType(\'' + worldNickName + '\', \'day\', null, null, this.value)"><option value="0">Normal</option><option value="1">Check Tiles</option><option value="2">Force Render</option><option value="3">Ignore changes</option></select></details><br><input type="checkbox" class="caves enable" onchange="selectedRenderType(\'' + worldNickName + '\', \'caves\', this.checked)" /><details><summary>Caves</summary><p>A cave render with or without depth tinting (check overviewer tab for setting)</p><select class="caves renderType" onchange="selectedRenderType(\'' + worldNickName + '\', \'caves\', null, null, this.value)"><option value="0">Normal</option><option value="1">Check Tiles</option><option value="2">Force Render</option><option value="3">Ignore changes</option></select></details><br><input type="checkbox" class="night enable" onchange="selectedRenderType(\'' + worldNickName + '\', \'night\', this.checked)" /><details><summary>Night</summary><p>A "nighttime" render with blocky lighting.</p><p><input type="checkbox" class="night smoothLighting" onchange="selectedRenderType(\'' + worldNickName + '\', \'night\', null, this.checked)" />Smooth Lighting</p><select class="night renderType" onchange="selectedRenderType(\'' + worldNickName + '\', \'night\', null, null, this.value)"><option value="0">Normal</option><option value="1">Check Tiles</option><option value="2">Force Render</option><option value="3">Ignore changes</option></select></details><br><input type="checkbox" class="minerals enable" onchange="selectedRenderType(\'' + worldNickName + '\', \'minerals\', this.checked)" /><details><summary>Minerals</summary><p>Overlay that colors the map according to what minerals can be found underneath</p><select class="minerals renderType" onchange="selectedRenderType(\'' + worldNickName + '\', \'minerals\', null, null, this.value)"><option value="0">Normal</option><option value="1">Check Tiles</option><option value="2">Force Render</option><option value="3">Ignore changes</option></select></details><br><input type="checkbox" class="spawn enable" onchange="selectedRenderType(\'' + worldNickName + '\', \'spawn\', this.checked)" /><details><summary>Spawn</summary><p>Overlay that colors the map red in areas where monsters can spawn</p><select class="spawn renderType" onchange="selectedRenderType(\'' + worldNickName + '\', \'spawn\', null, null, this.value)"><option value="0">Normal</option><option value="1">Check Tiles</option><option value="2">Force Render</option><option value="3">Ignore changes</option></select></details><br><input type="checkbox" class="nether enable" onchange="selectedRenderType(\'' + worldNickName + '\', \'nether\', this.checked)" /><details><summary>Nether</summary><p>A normal lighting render of the nether</p><p><input type="checkbox" class="nether smoothLighting" onchange="selectedRenderType(\'' + worldNickName + '\', \'nether\', null, this.checked)" />Smooth Lighting</p><select class="nether renderType" onchange="selectedRenderType(\'' + worldNickName + '\', \'nether\', null, null, this.value)"><option value="0">Normal</option><option value="1">Check Tiles</option><option value="2">Force Render</option><option value="3">Ignore changes</option></select></details><br><input type="checkbox" class="end enable" onchange="selectedRenderType(\'' + worldNickName + '\', \'end\', this.checked)" /><details><summary>End</summary><p>A normal lighting render of the end</p><p><input type="checkbox" class="end smoothLighting" onchange="selectedRenderType(\'' + worldNickName + '\', \'end\', null, this.checked)" />Smooth Lighting</p><select class="end renderType" onchange="selectedRenderType(\'' + worldNickName + '\', \'end\', null, null, this.value)"><option value="0">Normal</option><option value="1">Check Tiles</option><option value="2">Force Render</option><option value="3">Ignore changes</option></select></details></div>');
	ipcRenderer.send('loadWorldSettings', worldNickName);
	tabCounter++;
	redoTabs();
});

ipcRenderer.on('gotWorldSettings', function (event, worldNickName, json) {
	Object.keys(json.directions).forEach(function (direction) {
		if (json.directions[direction]) {
			$('div.worldItem.' + worldNickName + ' div.directions div.direction.' + direction).addClass('selected');
		} else {
			$('div.worldItem.' + worldNickName + ' div.directions div.direction.' + direction).removeClass('selected');
		}
	});

	// TODO: smooth lighting checkbox

	Object.keys(json.renderTypes).forEach(function (renderType) {
		$('div.worldItem.' + worldNickName + ' input:checkbox.enable.' + renderType).prop('checked', json.renderTypes[renderType].enabled);
		if (('smoothLighting' in json.renderTypes[renderType]))
			$('div.worldItem.' + worldNickName + ' input:checkbox.smoothLighting.' + renderType).prop('checked', json.renderTypes[renderType].smoothLighting);
		$('div.worldItem.' + worldNickName + ' details select.renderType.' + renderType).val(json.renderTypes[renderType].updateMode);
	});
});