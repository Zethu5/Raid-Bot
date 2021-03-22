const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const token = '<token>';

const sub_commands = ['help', 'set', 'show', 'delete'];
const date_options = ['today', 'tomorrow'];

client.on('ready', () => {
    console.log('Raid bot online');
})

client.on('message', msg => {
    if(msg.content.match(/^\!raid/)) {
        let command = msg.content;
        let sub_command = command.replace(/^\!raid\s+/,"").match(/\w+/).toString();
        let administrator_permission = 'ADMINISTRATOR';
        let date_time_json_file = 'raid_date_time.json';
        let clan_picture = "https://i.imgur.com/qEBHLjW.png";

        // Check if the sub command matches any registered sub commands
        if(sub_commands.includes(sub_command)) {
            switch(sub_command) {
                // help command
                case 'help':
                    let help_message = new Discord.RichEmbed()
                    .setColor(0x00AE86)
                    .setTimestamp()
                    .addField("Set raid time (Admin only)", "**!raid set -day [today|tomorrow] -time <XX:XX>**")
                    .addField("Show raid time", "**!raid show**")
                    .addField("Delete raid", "**!raid delete**")
                    .addField("Help", "**!raid help**")

                    msg.channel.send(help_message);
                    break;
                // set raid date/time command
                case 'set':
                    // only administrators can use this command
                    if(msg.member.hasPermission(administrator_permission)) {
                        let flags = command.replace(/^\!raid\s+set\s+/,"").toString();
                        let date = flags.match(/\-day\s+\w+/);
                        let time = flags.match(/\-time\s+\d{2}(\:\d{2})?/);

                        // validate both variables are correct via match functions
                        if(date && time) {
                            date = date[0].toString().replace(/\-day\s+/, '').toString();
                            time = time[0].toString().replace(/\-time\s+/, '').toString();

                            // validate date variable
                            if(date_options.includes(date)) {
                                let valid = true;
                                let hours = Number(time.replace(/\:\d{2}/,''));
                                let minutes = Number(time.replace(/^\d{2}\:/,''));

                                if(hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                                    let raid_message = new Discord.RichEmbed()
                                    .setColor(0x00AE86)
                                    .setTimestamp()
                                    .addField("\u200b",'> **Incorrect hour**')

                                    msg.channel.send(raid_message);
                                } else {
                                    let raid_timestamp = new Date();
                                    raid_timestamp.setHours(hours);
                                    raid_timestamp.setMinutes(minutes);
    
                                    if(date == "today") {
                                        if(raid_timestamp - Date.now() <= 0) {
                                            let raid_message = new Discord.RichEmbed()
                                            .setColor(0x00AE86)
                                            .setTimestamp()
                                            .addField("\u200b",'**Time has already passed**')

                                            msg.channel.send(raid_message);
                                            valid = false;
                                        }
                                    } else {
                                        // raise timestamp by 1 day
                                        raid_timestamp.timestamp += 24*60*60*1000;
                                    }
    
                                    if(valid) {
                                        // write json data to file
                                        let date_time_json = {
                                            initiator: msg.member.user.username,
                                            raid_timestamp: raid_timestamp.getTime(),
                                            timestamp: Date.now()
                                        }
    
                                        fs.writeFileSync(date_time_json_file, JSON.stringify(date_time_json));

                                        let raid_message = new Discord.RichEmbed()
                                        .setColor(0x00AE86)
                                        .setTimestamp()
                                        .addField("\u200b",'Raid set to **' + date + ' at ' + time + '**')
                                        
                                        msg.channel.send(raid_message);
                                    }
                                }
                            } else {
                                let raid_message = new Discord.RichEmbed()
                                .setColor(0x00AE86)
                                .setTimestamp()
                                .addField("\u200b",'**Command input incorrect, please try again**')

                                msg.channel.send(raid_message);
                            }
                        } else {
                            let raid_message = new Discord.RichEmbed()
                            .setColor(0x00AE86)
                            .setTimestamp()
                            .addField("\u200b",'**Command input incorrect, please try again**')

                            msg.channel.send(raid_message);
                        }

                    } else {
                        let raid_message = new Discord.RichEmbed()
                        .setColor(0x00AE86)
                        .setTimestamp()
                        .addField("\u200b",'You are not allowed to use: **!raid set**')

                        msg.channel.send(raid_message);
                    }
                    break;
                // show raid date/time command
                case 'show':
                    try {
                        let raid_json_data = JSON.parse(fs.readFileSync(date_time_json_file));
                        let raid_timestamp = new Date(raid_json_data['raid_timestamp'])
                        let time_difference = raid_timestamp - Date.now();
                        let response;

                        let delta = Math.abs(time_difference) / 1000;

                        let hours = Math.floor(delta / 3600) % 24;
                        delta -= hours * 3600;

                        let minutes = Math.floor(delta / 60) % 60;
                        delta -= minutes * 60;
                        
                        let seconds = Math.floor(delta % 60);

                        if(time_difference < 0) {
                            time_difference = Math.abs(time_difference);
                            response = "**Raid started " + hours + " hours, " + minutes + " minutes and " + seconds + " seconds ago**";
                        } else {
                            response = "**Raid will begin in " + hours + " hours, " + minutes + " minutes and " + seconds + " seconds**";
                        }

                        let raid_message = new Discord.RichEmbed()
                        .setColor(0x00AE86)
                        .setTimestamp()
                        .addField("\u200b",response)

                        msg.channel.send(raid_message);
                    } catch (error) {
                        let raid_message = new Discord.RichEmbed()
                        .setColor(0x00AE86)
                        .setTimestamp()
                        .addField("\u200b","**No raid scheduled**")

                        msg.channel.send(raid_message);
                    }
                    break;
                case 'delete':
                    if(msg.member.hasPermission(administrator_permission)) {
                        let response;
                        
                        try {
                            fs.writeFileSync(date_time_json_file, '');
                            response = "**Raid deleted**";
                        } catch (error) {
                            response = "**[Error] Couldn't delete raid**";
                        }

                        let raid_message = new Discord.RichEmbed()
                        .setColor(0x00AE86)
                        .setTimestamp()
                        .addField("\u200b", response)

                        msg.channel.send(raid_message);

                    } else {
                        let raid_message = new Discord.RichEmbed()
                        .setColor(0x00AE86)
                        .setTimestamp()
                        .addField("\u200b", 'You are not allowed to use: **!raid delete**')

                        msg.channel.send(raid_message);
                    }
                    break;
            }
        } else {
            let raid_message = new Discord.RichEmbed()
            .setColor(0x00AE86)
            .setTimestamp()
            .addField("\u200b", 'No such command: **!raid ' + sub_command + '**')

            msg.channel.send(raid_message);
        }
    }
})

client.login(token);
