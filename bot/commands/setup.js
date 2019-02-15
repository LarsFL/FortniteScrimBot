const _exports = require("../exports.js");

module.exports.main = function(msg,cmd,category,...value) {
    _exports.getData(msg.guild, (data) => {
        value = value.join(" ");
        if (!category) return msg.reply(`\nUpdate these values to your likings.\nTo edit, use this command ${data.prefix}setup <category> <value>\n\nNote: To be able to host scrim games, you need to assign all last 3 settings\n\n**Categories:**\n__prefix__ - current: ${data.prefix}\n__modrole__ ***(optional)*** - current: ${data.modrole}\n__mutedrole__ ***(optional)*** - current: ${data.mutedrole}\n__scrimrole__ ***(optional)*** - current: ${data.scrimrole}\n__hostrole__ ***(required)*** - current: ${data.hostrole}\n__textchannel__  (no #) ***(required)*** - current: ${data.textchannel}\n__voicechannel__ ***(required)*** - current: ${data.voicechannel}`);
        if (!value) return msg.reply("value not found, try again.");
        _exports.setData(msg.guild, { [category]: value });
        msg.reply(`${category} updated to ${value}`);
    });
};