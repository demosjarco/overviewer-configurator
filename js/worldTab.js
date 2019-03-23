function selectedRenderDirection(worldNickName, direction) {
	console.log(direction);
	if ($('main div.worldItem div.directions div.direction.' + direction).hasClass('selected')) {
		// Unselect
		$('main div.worldItem div.directions div.direction.' + direction).removeClass('selected');
	} else {
		// Select
		$('main div.worldItem div.directions div.direction.' + direction).addClass('selected');
	}
}