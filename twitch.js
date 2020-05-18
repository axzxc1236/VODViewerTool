function getVideoInfo(videoID) {
	return fetch(`https://api.twitch.tv/kraken/videos/${videoID}`, {
		headers: {
			"Accept": "application/vnd.twitchtv.v5+json",
			"Client-ID": localStorage.getItem("ClientID")
		}
	})
	.then(result => result.json())
	.catch(error => {
		alert(
			`Error happened, ${error}\n` +
			"Maybe try again in a minute"
		);
	})
}