/**
* YouList v0.3
*
* Cyril Halmo, 2015
*/

var cookieName = "YouListLastLinkList";
var fileName;
var player;
var started;
var playing;
var ids;
var currentIndex;
var currentTitle;
var playerLoaded = false;
var fileField = document.getElementById('file');
var linkList = $('#linkList');

function main() {
	fileField.addEventListener('dragover', handleDrag, false);
	fileField.addEventListener('drop', handleFile, false);
	var lastFileName = $.cookie(cookieName);
	if (lastFileName != undefined) {
		$.get(lastFileName)
		.done(function() {
			fileName = lastFileName;
			loadPlayer();
		})
		.fail(function() {
			$.removeCookie(cookieName)
		});
	}
}

function handleDrag(event) {
	event.stopPropagation();
	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy';
}
  
function handleFile(event) {
	event.stopPropagation();
	event.preventDefault();
	var f = event.dataTransfer.files[0];
	var reader = new FileReader();
	reader.onload = (function(theFile) {
		fileName = theFile.name;
		$.cookie(cookieName, fileName, { expires: 100 });
		if (playerLoaded)
			loadLinks();
		else {
			loadPlayer();
		}
	})(f);
}

function loadPlayer() {
	playerLoaded = true;
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/player_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubePlayerAPIReady() {
	player = new YT.Player('ytplayer', {
		height: '390',
		width: '640',
		videoId: 'ogci09kq_u4',
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange,
		}
	});
}

function onPlayerReady() {
	player.playVideo();
	loadLinks();
}

function nextVideo() {
	if (ids.length === 0)
		return;
	if (ids.length === currentIndex + 1)
		playVideo(ids[0]);
	else
		playVideo(ids[currentIndex + 1]);
}

function previousVideo() {
	if (ids.length === 0)
		return;
	if (currentIndex === 0)
		playVideo(ids[ids.length - 1]);
	else
		playVideo(ids[currentIndex - 1]);
}

function onPlayerStateChange(event) {
	switch (event.data) {
		case YT.PlayerState.ENDED:
			playing = false;
			refreshTitle();
			playVideo(ids[currentIndex + 1]);
			break;
		case YT.PlayerState.PLAYING:
			started = true;
			playing = true;
			refreshTitle();
			break;
		case YT.PlayerState.BUFFERING:
			started = true;
			break;
		case YT.PlayerState.PAUSED:
			playing = false;
			refreshTitle();
			break;
		case YT.PlayerState.UNSTARTED:
			started = false;
			var cindex = currentIndex;
			setTimeout(function() {
				if (!started && cindex === currentIndex)
					nextVideo();
			}, 3000);
			break;
	}
}

function loadLinks() {
	ids = [];
	linkList.html('');
	$.get(fileName, function(data) {
		getFileSuccess(data);
	});
}

function getFileSuccess(data) {
	var tempIds = $(data).find("ID");
	tempIds.each(function() {
		var id = $(this).text().replace(/[^a-z0-9_]/gmi, "").replace(/\s+/g, "");
		if (id === "")
			return;;
		getGoogleApi(id);
		ids.push(id);
		var inner = '<li id="' + id + '" class="list-group-item" onclick="playVideo(\'' + id + '\')"><span id="' + id + '_title"></span><span class="right">' + id + '</span></li>';
		linkList.append(inner);
	});
	if (ids.length > 0)
		playVideo(ids[0]);
	else {
		$('#videoTitle').html('Keine gültigen Video-Ids gefunden in ' + fileName);
		$('#videoId').html('Hier, ein lustiges Video^^');
		player.loadVideoById('ogci09kq_u4');
		$.removeCookie(cookieName);
	}
}

function getGoogleApi(id) {
	$.get('https://www.googleapis.com/youtube/v3/videos?id=' + id + '&key=AIzaSyClSAivvH55NxfVNuhvLpZtKhHLmi2jx20&part=snippet', function(data) {
		if (data.pageInfo.totalResults === 0) {
			// $('#' + id + '_title').css('background-color', 'lightsalmon');
			$('#' + id + '_title').html('Ungültige Id');
			$('#' + id + '_title').addClass("label label-danger");
			return;
		}
		var title = data.items[0].snippet.title;
		$('#' + id + '_title').html(title);
	});
}

function playVideo(id) {
	var newEle = $('#' + id);
	var currEle = $('#' + ids[currentIndex]);
	player.loadVideoById(id, 0, 'large');
	currEle.css('background-color', '');
	newEle.css('background-color', 'lightgray');
	currentIndex = ids.indexOf(id);
	setTitle(id);
}

function setTitle(id) {
	var title = $('#' + id + '_title').html();
	if (typeof title === 'undefined' || title === "") {
		setTimeout(function() {
			setTitle(id);
		}, 1000);
	} else {
		currentTitle = title;
		$('#videoTitle').html(title);
		$('#videoId').html(id);
		refreshTitle();
	}
}

function refreshTitle() {
	if (playing)
		$('#theTitle').html("\u25B6 " + currentTitle);
	else
		$('#theTitle').html(currentTitle);
}

main();