const { Client, RichEmbed } = require('discord.js');

const pathLink = require('path').resolve(__dirname, "guilds.db");
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(pathLink);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS guilds (id TEXT, data TEXT)");
});

let scrims = {};

// access: 0 = everyone; access: 1 = moderators; 2 = scrim hoster; access: 3 = administrators;
exports.commands = {
	// everyone
	help:{access:0,desc:"shows all available commands"},
	host:{access:2,desc:"host scrim game"},
    setup: { access: 2, desc: "set up bot to function correctly" },
    rules: { access: 2, desc: "Go over the rules in the voicechannel" }
};

exports.newGuild = function (guild) {
    db.get("SELECT * FROM guilds WHERE id = ?", guild.id, (err, result) => {
        if (err) return console.log(err.message);
        if (!result) {
            let data = {
                setup: false,
                prefix: ",",
                modrole: "",
                mutedrole: "",
                scrimrole: "",
                hostrole: "",
                textchannel: "",
                voicechannel: ""
            };
            db.run(`INSERT INTO guilds VALUES(?,?)`, guild.id, JSON.stringify(data), function (err) {
                if (err) return console.log(err.message);
                console.log(`guild ${guild.id} added to database`);
            });
        }
    });
};

exports.delGuild = function (guild) {
    db.run("DELETE FROM guilds WHERE id = ?", guild.id, (err, result) => {
        if (err) return console.log(err.message);
        console.log(`guild ${guild.id} removed from database`);
    });
};

exports.setData = function (guild, newData) {
    exports.getData(guild, (data) => {
        if (typeof newData === "object") {
            Object.keys(newData).forEach(function (key) {
                if (data[key] !== undefined) data[key] = newData[key];
            });
        }

        if (data.hostrole !== "" && data.textchannel !== "" && data.voicechannel !== "") {
            data.setup = true;
        } else {
            data.setup = false;
        }

        db.run("UPDATE guilds SET data = ? WHERE id = ?", JSON.stringify(data), guild.id, (err, result) => {
            if (err) return console.log(err.message);
        });
    });
};

exports.getData = function (guild, callback) {
    db.get("SELECT * FROM guilds WHERE id = ?", guild.id, (err, result) => {
        if (err) return console.log(err.message);
        if (result) {
            callback(JSON.parse(result.data));
        }
    });
};

exports.returnData = function (guild) {
    result = db.get("SELECT * FROM guilds WHERE id = ?", guild.id, function (err, result) {
        if (err) return console.log(err.message);
        if (result) {
            data = JSON.parse(result.data);
            return (data);
        }
    });
};

exports.one = function (val) {
    if (val === 0) return "now"; else return val + " minutes";
};

let updatelist = function (guild, last) {
    if (last === true) {
        scrims[guild.id].codes = false;
        const embed = new RichEmbed()
            .setColor(0xc1d9ff)
            .setTitle("Final Players");
        Object.keys(scrims[guild.id].codedata).forEach(function (key) {
            let codeobj = scrims[guild.id].codedata[key];
            let user_str = "";
            let amount = Object.keys(codeobj).length;
            Object.keys(scrims[guild.id].codedata[key]).forEach(function (key2, count) {
                let user = scrims[guild.id].codedata[key][key2];
                user_str = user_str + user + "\n";
            });
            embed.addField(key + " (" + amount + " players)", user_str, true);
        });

        exports.getData(guild, (data) => {
            let channel = guild.channels.find(channel => channel.name === data.textchannel);
            if (scrims[guild.id].message) {
                channel.fetchMessage(scrims[guild.id].message)
                    .then(msg => {
                        msg.edit(embed);
                    });
            }
        });
    } else {
        const embed = new RichEmbed()
            .setColor(0xef4d0e)
            .setTitle("Current Players");
        Object.keys(scrims[guild.id].codedata).forEach(function (key) {
            let codeobj = scrims[guild.id].codedata[key];
            let user_str = "";
            let amount = Object.keys(codeobj).length;
            Object.keys(scrims[guild.id].codedata[key]).forEach(function (key2, count) {
                if (count <= 15) {
                    let user = scrims[guild.id].codedata[key][key2];
                    user_str = user_str + user + "\n";
                    if (amount > 15 && count === 15) user_str = user_str + "and more...";
                }
            });
            embed.addField(key + " (" + amount + " players)", user_str, true);
        });

        exports.getData(guild, (data) => {
            let channel = guild.channels.find(channel => channel.name === data.textchannel);
            if (scrims[guild.id].message === false) {
                channel.send(embed)
                    .then(msg => {
                        scrims[guild.id].message = msg.id;
                    });
            } else {
                channel.fetchMessage(scrims[guild.id].message)
                    .then(msg => {
                        msg.edit(embed);
                    });
            }
        });
    }
};

let startgame = function (guild, channel1, channel2) {
    channel2.join().then(connection => {
        const dispatcher = connection.playFile('./sound/countdown.mp3');
        console.log("Making sound");
        dispatcher.on('end', (reason) => {
            console.log("want to stop");
            setTimeout(function rest() {
                channel2.leave();
                console.log(reason);
                const embed2 = new RichEmbed()
                    .setColor(0xef950e)
                    .setTitle("Post your 3-digit server code below!")
                    .setDescription("Enter the code in this channel. The code is located in the top left corner of your screen - the last three digits are your code.")
                    .setImage("https://i.imgur.com/L2AJeKO.png", false);
                channel1.send(embed2);
                scrims[guild.id].codes = true;
            }, 250);

        });
    });
};


exports.startScrim = function(guild,host,type,time){
    const embed = new RichEmbed()
        .setColor(0xf7d22e)
        .addField("Scrim Match Starting", "Scrim match is starting in " + exports.one(time), false)
        .addField("Mode", type.toUpperCase(), true)
        .addField("Host", host, true)
        .addField("Instructions", "Countdown will happen in the countdown voice channel. Ready up in-game when you hear the bot say GO. Once you're done, come back to this channel for further information.", false);

    exports.getData(guild, (data) => {
		let channel1 = guild.channels.find(channel => channel.name === data.textchannel);
        let channel2 = guild.channels.find(channel => channel.name === data.voicechannel);
		if (channel1 && channel2) {
            channel1.send(embed);
            scrims[guild.id] = {
                timer: setTimeout(function () {
                    startgame(guild, channel1, channel2,time * 60000);
                }, 1),
                timer2: setTimeout(function () {
                    updatelist(guild, true);
                }, 3 * 60000)
            };
            scrims[guild.id].delete = true;
            scrims[guild.id].codedata = {};
            scrims[guild.id].message = false;
		}
	});
};

exports.stopScrim = function (guild) {
    if (scrims[guild.id]) {
        if (scrims[guild.id].timer) clearTimeout(scrims[guild.id].timer);
        if (scrims[guild.id].timer2) clearTimeout(scrims[guild.id].timer2);
        delete scrims[guild.id];
    }
};

function replacecode(guild,user) {
    Object.keys(scrims[guild.id].codedata).forEach(function (key) {
        Object.keys(scrims[guild.id].codedata[key]).forEach(function (key2, count) {
            let userr = scrims[guild.id].codedata[key][key2];
            if (user.id === userr.id) delete scrims[guild.id].codedata[key][key2];
            if (Object.keys(scrims[guild.id].codedata[key]).length === 0) delete scrims[guild.id].codedata[key];
        });
    });
}

exports.setScrimData = function (guild, user, code) {
    if (code.length > 3 || code.length < 3) return;
    if (!scrims[guild.id].codedata[code]) scrims[guild.id].codedata[code] = {};
    replacecode(guild, user);
    scrims[guild.id].codedata[code][user.id] = user;
    updatelist(guild);
};

exports.getScrimData = function (guild) {
    if (guild && scrims[guild.id]) return scrims[guild.id];
};
