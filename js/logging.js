'use strict';

let numVisibleMessages = 25;
newVisualLog('Last ' + numVisibleMessages + ' messages will appear here');

ipcRenderer.on('visualLog', function (event, message) {
	newVisualLog(message);
});

function newVisualLog(message) {
	let tempDate = new Date();
	$(function () {
		$('div#timeline').prepend('<div class="log"><span class="time">' + tempDate.toLocaleTimeString() + '</span><span class="message">' + message + '</span></div>');
		if ($('div#timeline div.log').length > numVisibleMessages)
			$('div#timeline div.log').slice(numVisibleMessages - 1).remove();
	});
}