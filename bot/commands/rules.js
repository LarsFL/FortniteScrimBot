let _exports = require("../exports.js");

module.exports.main = function (msg) {
	_exports.getData(msg.guild, (data) => {
		voicechannel = msg.guild.channels.find(channel => channel.name === data.voicechannel);
		msg.reply("Going over the rules in " + data.voicechannel);
		voicechannel.join().then(connection => {
			const dispatcher = connection.playFile('./sound/321.mp3');
			dispatcher.on('end', (reason) => {
				console.log(reason);
				voicechannel.leave();
			}
            );
		});
	}, 10);
};
