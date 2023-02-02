import { SlashCommandBuilder, time } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Invite the bot to your server"),
  async execute(interaction, client, commands, commandType) {
    await commandType.reply(interaction, {
      content: `Not available yet.`,
      ephemeral: true,
    });

    return;
  },
};
