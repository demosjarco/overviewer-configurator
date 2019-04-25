function selectedRenderDirection(worldNickName, direction) {
	if ($('main div.worldItem div.directions div.direction.' + direction).hasClass('selected')) {
		// Unselect
		$('main div.worldItem div.directions div.direction.' + direction).removeClass('selected');
		let temp = {};
		temp[direction] = false;
		ipcRenderer.send('updateWorldInfo', worldNickName, temp);
	} else {
		// Select
		$('main div.worldItem div.directions div.direction.' + direction).addClass('selected');
		let temp = {};
		temp[direction] = true;
		ipcRenderer.send('updateWorldInfo', worldNickName, temp);
	}
}

function selectedRenderType(worldNickName, renderType, enabled1, smoothLighting1, renderMode) {
	let temp = {};
	if (renderMode) {
		temp[renderType] = { updateMode: parseInt(renderMode) };
		ipcRenderer.send('updateWorldInfo', worldNickName, null, null, null, temp);
	} else {
		temp[renderType] = { enabled: enabled1 };
		ipcRenderer.send('updateWorldInfo', worldNickName, null, null, temp);
	}
}