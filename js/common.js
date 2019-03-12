window.$ = window.jQuery = require('jquery');

$('aside ul li').height($(window).width() * 0.05);
$('aside ul li').css('line-height', ($(window).width() * 0.05) + 'px');
$(window).on('resize', function () {
	$('aside ul li').height($(this).width() * 0.05);
	$('aside ul li').css('line-height', ($(this).width() * 0.05) + 'px');
}).resize();
$("#tabs").tabs();