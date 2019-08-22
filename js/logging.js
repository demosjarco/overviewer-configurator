'use strict';

let numVisibleMessages = 25;
newVisualLog('Last ' + numVisibleMessages + ' messages will appear here');

ipcRenderer.on('visualLog', function (event, message) {
	newVisualLog(message);
});

function newVisualLog(message) {
	let tempDate = new Date();
	$(function () {
		console.log(message);
		/*$('body main div#tabs-1 div#tabs1-content #tabs1-2 ul').prepend('<li><span class="timeStamp">' + tempDate.toLocaleTimeString() + '</span><span class="message">' + message + '</span></li>');
		if ($('body main div#tabs-1 div#tabs1-content #tabs1-2 ul li').length > numVisibleMessages)
			$('body main div#tabs-1 div#tabs1-content #tabs1-2 ul li').slice(numVisibleMessages - 1).remove();*/
	});
}