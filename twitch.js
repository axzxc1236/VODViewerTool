function getVideoInfo(videoID) {
	if (localStorage.getItem("APIVersion") == "V5")
		return getVideoInfoV5(videoID);
	else if (localStorage.getItem("HelixToken"))
		return getVideoInfoHelix(videoID);
	else
		return new Promise(function (resolve, reject) {
			reject({
				"error": "No Helix API token provided",
				"message": "You need an API token from Twitch."
			});
		});
}

function getVideoInfoV5(videoID) {
	return fetch(`https://api.twitch.tv/kraken/videos/${videoID}`, {
		headers: {
			"Accept": "application/vnd.twitchtv.v5+json",
			"Client-ID": localStorage.getItem("ClientID")
		}
	})
	.then(result => result.json())
}

function getVideoInfoHelix(videoID) {
	return fetch(`https://api.twitch.tv/helix/videos?id=${videoID}`, {
		headers: {
			"Client-ID": localStorage.getItem("ClientID"),
			"Authorization": "Bearer " + localStorage.getItem("HelixToken")
		}
	})
	.then(result => result.json())
	.then(result => {
		console.log(result);
		//Convert some of Helix data format to the format that this program needs.
		result["channel"] = [];
		result["channel"]["display_name"] = result["data"][0]["user_name"];
		result["recorded_at"] = result["data"][0]["created_at"];
		result["title"] = result["data"][0]["title"];
		//result["duration"] has different formats
		//like **h**m**s
		//  or **m**s
		let seconds = 0;
		const hh = result["data"][0]["duration"].match(/(\d+)h/);
		const mm = result["data"][0]["duration"].match(/(\d+)m/);
		const ss = result["data"][0]["duration"].match(/(\d+)s/);
		if (hh) seconds += parseInt(3600*hh[1]);
		if (mm) seconds += parseInt(60*mm[1]);
		if (ss) seconds += parseInt(ss[1]);
		result["length"] = seconds;
		return result;
	})
}