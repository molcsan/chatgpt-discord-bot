import {ActivityType, Events} from "discord.js";
import chalk from "chalk";
import {resetto0} from "../modules/loadbalancer.js";
import supabase from "../modules/supabase.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    await resetto0();
    client.user.setPresence({
      activities: [
        { name: `BBS`, type: ActivityType.Playing },
      ],
      status: "online",
    });

    const { data, error } = await supabase.from("conversations_2").delete();
    console.log(
      chalk.white(`Ready! Logged in as `) + chalk.blue.bold(client.user.tag)
    );
  },
};
