const { ipcRenderer } = require('electron');

$(document).ready(function () {
	$("#tabs").tabs();
	$('aside ul li').height($(window).width() * 0.0375);
	$('aside ul li').css('line-height', ($(window).width() * 0.0375) + 'px');
});
$(window).on('resize', function () {
	$('aside ul li').height($(this).width() * 0.0375);
	$('aside ul li').css('line-height', ($(this).width() * 0.0375) + 'px');
}).resize();