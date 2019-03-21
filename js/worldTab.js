function selectedRenderDirection(direction) {
	console.log(direction);
	if ($('main div.worldItem div.directions div.direction.' + direction).hasClass('selected')) {
		console.log('was selected');
		// Unselect
		$('main div.worldItem div.directions div.direction.' + direction).removeClass('selected');
	} else {
		console.log('wasnt selected');
		// Select
		$('main div.worldItem div.directions div.direction.' + direction).addClass('selected');
	}
}