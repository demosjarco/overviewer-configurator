const { ipcRenderer } = require('electron');

$(function () {
	$("#tabs").tabs();
	$('aside ul li a').height($(window).width() * 0.0375).css('line-height', ($(window).width() * 0.0375) + 'px');
});
$(window).on('resize', function () {
	$('aside ul li a').height($(this).width() * 0.0375).css('line-height', ($(this).width() * 0.0375) + 'px');
}).resize();