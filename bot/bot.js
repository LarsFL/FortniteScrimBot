const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

client.login(config.token); // your bot token goes in bracke "<token>"

const fs = require('fs');
const commands_path = require("path").join(__dirname, "commands");

const _exports = require("./exports.js");

let tempcommands = {};

fs.readdirSync(commands_path).forEach(function(file) {
	let command = file.substr(0,file.length-3);
	tempcommands[command] = require("./commands/"+command+".js").main;
});

function hasAccess(access, member, data) {
//    disabled unnecessary logging 
//    console.log(data);
    isAdmin = member.hasPermission("ADMINISTRATOR");
    if (isAdmin) return true;
    if (access === 0) {
        return true;
    } else if (access === 1) {
        role = data.modrole;
        if (role !== "") {
            modrole = member.guild.roles.find("name", role);
            if (modrole) if (member.roles.has(modrole.id)) return true;
        } else {
            return false;
        }
    } else if (access === 2) {
        role = data.hostrole;
        if (role !== "") {
           console.log('4');
           hostrole = member.guild.roles.find("name", role);
           console.log('5');
           console.log("this is it: " + member.roles.has(hostrole.id));
           if (hostrole) if (member.roles.has(hostrole.id)) {
               console.log("You got access sir");
               returning = true;
               return true;
           }
        } else {
           return false;
        }
    } else {
        return false;
    }
}

client.on("ready", () => {
	console.log(`connected as ${client.user.tag}`);
	client.user.setActivity("Where we dropping bois");
    client.guilds.forEach(function (guild) {
        _exports.newGuild(guild);
//       disabled spammy startup log 
//       console.log("Guild `" + guild.name + "` Members `" + guild.memberCount + "`");
    });
});

client.on('guildCreate', guild => {
	_exports.newGuild(guild);
});

client.on('guildDelete', guild => {
	_exports.delGuild(guild);
});

client.on("message", msg => {
	if (msg.author.bot) return;
  
    _exports.getData(msg.guild,(data) => {
        let prefix = data.prefix;
		if (msg.content.startsWith(prefix)) {
			let found = false;
			let args = msg.content.substring(1);
			let no_perm_str = "You don't have access to this command!";
			args = args.split(" ");
			Object.keys(_exports.commands).forEach(function(command){
				let access = _exports.commands[command].access;
				if (args[0] === command) {
                    found = true;
                    _exports.getData(msg.member.guild, (data) => {
                        if (hasAccess(access, msg.member, data)) {
                            console.log("Has access");
                            tempcommands[command](msg, ...args);
                        } else {
                            console.log("Doesn't have access");
                            return msg.reply(no_perm_str);
                        }
                    });
				}
			});
        } else if (msg.channel.name === data.textchannel) {
            let scrimData = _exports.getScrimData(msg.guild);
			if (scrimData && scrimData.delete) {
				msg.delete();
            }
            if (scrimData && scrimData.codes) {
                _exports.setScrimData(msg.guild, msg.author, msg.content);
            }
		}
    });
});
