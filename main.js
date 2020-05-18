//Yes, it's my Client ID, I think it's fine to include it in here according to
//https://discuss.dev.twitch.tv/t/should-i-include-client-id-in-my-program-when-i-release-it/25687
//(Yes, I know that person replied to me is not a admin of the forum, I just take his/her word and public my Client ID)
//If you are working for Twitch and think I violated your rules, disable the Client ID!
const Default_Client_ID = "w12brm93mtqwb9evad5hxosenpjgyr";
let videoinfos = [];

function pageLoad() {
	//Load settings
	if (!localStorage.getItem("ClientID"))
		localStorage.setItem("ClientID", Default_Client_ID);
	$("#ClientID").attr("value", localStorage.getItem("ClientID"));
	if ($("#ClientID").attr("value") == Default_Client_ID)
		$("#ClientID").attr("value", "(Default Client ID, feel free to change it to yours)");
	if (localStorage.getItem("TimezoneFormat") != "local" && localStorage.getItem("TimezoneFormat") != "GMT")
		localStorage.setItem("TimezoneFormat", "local");
	$(`.TimeFormat[value=${localStorage.getItem("TimezoneFormat")}]`).get(0).click();
	
	//Event listener
	$("#setClientID").on("click", saveClientID);
	$("#addVideo").on("click", addVideo);
	$(".TimeFormat").on("click", saveTimezoneFormat);
	$("#timestampCalc").on("click", timestampCalculation);
}

function saveClientID() {
	if ($("#ClientID").attr("value") != "") {
		localStorage.setItem("ClientID", $("#ClientID").get(0).value);
		$("#settingSaved").text("ClientID is saved!");
	}
	else alert("Invalid ClientID");
}

function saveTimezoneFormat() {
	localStorage.setItem("TimezoneFormat", this.attr("value"));
	$("#settingSaved").text("Timezone Set to " + this.attr("value"));
	
	//Convert time format on table
	for (i=0; i<videoinfos.length; i++) {
		$(`table tr:nth-child(${i+2}) td:nth-child(3)`).text(
			localStorage.getItem("TimezoneFormat") == "local" ?
			new Date(videoinfos[i].recorded_at).toLocaleString() :
			new Date(videoinfos[i].recorded_at).toGMTString()
		)
	}
}

function addVideo() {	
	const match = $("#URL").get(0).value.match(/^https:\/\/www.twitch.tv\/videos\/(\d+)$/) ||
				  $("#URL").get(0).value.match(/^https:\/\/www.twitch.tv\/videos\/(\d+)\?t=\d+h\d+m\d+s$$/)
	if (match) {
		getVideoInfo(match[1])
		.then(result => {
			if (result["error"]) {
				console.log(result);
				alert("Error happened.\n" + JSON.stringify(result))
				return;
			} else {
				const info = {
					id: match[1],
					channel: result["channel"]["display_name"],
					title: result["title"],
					recorded_at: result["recorded_at"],
					length: result["length"]					
				};
				videoinfos.push(info);
				//write to table;
				const newRow = $("<tr>");
				newRow.appendChild($("<td>").text(info.channel));
				newRow.appendChild($("<td>").text(info.title));
				const startTime = localStorage.getItem("TimezoneFormat") == "local" ?
								new Date(info.recorded_at).toLocaleString() :
								new Date(info.recorded_at).toGMTString();
				newRow.appendChild($("<td>").text(startTime));
				const VODlength = Math.floor(info.length/3600).toString().padStart(2, "0") + ":" +
								  Math.floor((info.length%3600)/60).toString().padStart(2, "0") + ":" +
								  (info.length%60).toString().padStart(2, "0");
				newRow.appendChild($("<td>").text(VODlength + ` (${info.length} seconds)`));
				const removeButton = $("<input>");
				const btnindex = videoinfos.length - 1;
				removeButton.attr("type", "button");
				removeButton.attr("value", "remove video");
				removeButton.attr("onclick", `removeVideo(${btnindex})`);
				newRow.appendChild($("<td>").appendChild(removeButton));
				$(VideoInfos).appendChild(newRow);
				//Add option to Calculation area
				$("#VODs").appendChild($("<option>").attr("value", btnindex).text(info.channel + " - " + info.title));
			}
		})
	}
	else alert("The url provided doesn't match required format\n(or maybe Twitch changed VOD url format? IDK)");
	
	//If user provided a url with timestamp, set $("#VODtimestamp") value
	const match2 = $("#URL").get(0).value.match(/^https:\/\/www.twitch.tv\/videos\/\d+\?t=(\d+)h(\d+)m(\d+)s$/);
	if (match2) {
		$("#VODtimestamp").attr("value", `${match2[1]}:${match2[2]}:${match2[3]}`);
	}
}

function removeVideo(index) {
	//I know this area is quite unreadable.... but it works
	if (confirm(`Do you want to remove ${$(`#VideoInfos tr:nth-child(${index+2}) td:nth-child(2)`).text()}`)) {
		$(`#VideoInfos tr:nth-child(${index+2})`).remove();
		videoinfos.splice(index, 1);
		rebuildVODOptions();
		
	}
}

function rebuildVODOptions() {
	$("#VODs option").remove();
	for (const i in videoinfos) {
		$("#VODs").appendChild(
			$("<option>")
			.attr("value", i)
			.text(videoinfos[i].channel + " - " + videoinfos[i].title)
		);
	}
}

function timestampCalculation() {
	//Clear results if there is any
	$("#timestampResult tr").remove();
	$("#timestampResult")
		.appendChild(
			$("<tr>")
				.appendChild($("<td>").text("VOD"))
				.appendChild($("<td>").text("Timestamp"))
		)
	
	//parse timestamp
	let seconds = 0;
	const match = $("#VODtimestamp").get(0).value.match(/^(\d+):(\d+):(\d+)$/);
	if (match) {
		if (match[2] > 59 || match[3] > 59) {
			alert("Invalid timestamp");
			return;
		} else {
			seconds = parseInt(match[1]*3600) + parseInt(match[2]*60) + parseInt(match[3]);
		}
	} else {
		alert("Invalid timestamp");
		return;
	}
	
	//Calculate corresponding timestamp
	const selectedIndex = parseInt($("#VODs").get(0).value);
	if (selectedIndex === 0 || selectedIndex) {
		const VODdate = new Date(videoinfos[selectedIndex].recorded_at);
		VODdate.setSeconds(VODdate.getSeconds() + seconds);
		for (const info of videoinfos) {
			InfoStartDate = new Date(info.recorded_at);
			InfoEndStreamingDate = new Date(info.recorded_at);
			InfoEndStreamingDate.setSeconds(InfoEndStreamingDate.getSeconds() + info.length);
			let result = "";
			let createLink = false;
			if (VODdate < InfoStartDate)
				result = "Wasn't started at that time.";
			else if (VODdate > InfoEndStreamingDate)
				result = "Has ended at that time";
			else {
				//Calculate corresponding timestamp in hh:mm:ss format
				const secondsInVOD = Math.floor((VODdate.getTime() - InfoStartDate.getTime())/1000);
				result = Math.floor(secondsInVOD/3600).toString().padStart(2, "0") + ":" +
						 Math.floor((secondsInVOD%3600)/60).toString().padStart(2, "0") + ":" +
						 (secondsInVOD%60).toString().padStart(2, "0");
				createLink = true;
			}
			//Write row to table
			const newRow = $("<tr>").appendChild($("<td>").text(info.channel + " - " + info.title));
			if (!createLink)
				newRow.appendChild($("<td>").text(result))
			else {
				let TwitchTimestamp = result + "s";
				TwitchTimestamp = TwitchTimestamp.replace(":", "h");
				TwitchTimestamp = TwitchTimestamp.replace(":", "m");
				newRow.appendChild(
					$("<td>").appendChild(
						$("<a>")
						.text(result)
						.attr("href", `https://www.twitch.tv/videos/${info.id}?t=${TwitchTimestamp}`)
						.attr("target", "_blank")
					)
				);
			}
			$("#timestampResult").appendChild(newRow);
		}
	}
	else alert("Please select a VOD");
}