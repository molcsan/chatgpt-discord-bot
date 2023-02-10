import {Events} from "discord.js";

const msgType = {
  type: "message",
  load: async (msg) => {
    await msg.react("<a:loading:1051419341914132554>");
  },
  reply: async (msg, content) => {
    await msg.reply(content);
    try {
      await msg.reactions.removeAll();
    } catch (err) {}
  },
};

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    if (message.mentions.has(client.user) && !message.author.bot) {
      let content = message.content;
      if (message.content.includes(`<@${client.user.id}>`)) {
        content = message.content.split(`<@${client.user.id}> `)[1];
      }

      //console.log(content);
      let commandName = content;
      const commands = await client.commands.toJSON();
      if (!commandName) commandName = "help";
      let command = client.commands.get(commandName);
      const options: any = {};
      message.user = message.author;

      if (!command) {
        commandName = "chat";
        command = client.commands.get(commandName);
      }
      if (command.disablePing) return;
      if (commandName == "chat") {
        options.message = content.replace("chat ", "");
        options.model = "chatgpt";
      }

      try {
        await command.execute(message, client, commands, msgType, options);
      } catch (error) {
        console.error(error);
        await message.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  },
};
