function selectedRenderDirection(worldNickName, direction) {
	if ($('body main div.worldItem div.directions div.direction.' + direction).hasClass('selected')) {
		// Unselect
		$(this).removeClass('selected');
		let temp = {};
		temp[direction] = false;
		ipcRenderer.send('updateWorldInfo', worldNickName, temp);
	} else {
		// Select
		$('body main div.worldItem div.directions div.direction.' + direction).addClass('selected');
		let temp = {};
		temp[direction] = true;
		ipcRenderer.send('updateWorldInfo', worldNickName, temp);
	}
}

function selectedRenderType(worldNickName, renderType, enabled1, smoothLighting1, renderMode) {
	let temp = {};
	if (renderMode != null && renderMode != undefined) {
		temp[renderType] = { updateMode: parseInt(renderMode) };
		ipcRenderer.send('updateWorldInfo', worldNickName, null, null, temp);
	}
	if (smoothLighting1 != null && smoothLighting1 != undefined) {
		temp[renderType] = { smoothLighting: smoothLighting1 };
		ipcRenderer.send('updateWorldInfo', worldNickName, null, null, temp);
	}
	if (enabled1 != null && enabled1 != undefined) {
		temp[renderType] = { enabled: enabled1 };
		ipcRenderer.send('updateWorldInfo', worldNickName, null, temp);
	}
}