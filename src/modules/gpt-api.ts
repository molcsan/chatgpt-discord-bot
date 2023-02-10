//import { chatgptToken } from "chatgpt-token/module";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import {removeMessage, useToken} from "./loadbalancer.js";
import supabase from "./supabase.js";

dotenv.config();

async function chat(message, userName, ispremium, m, id) {
  const token = await useToken();
  if (!token) {
    return {
      error: `We are reaching our capacity limits right now.`,
    };
  }
  try {
    let response;
    let model;
    let prompt;
    const stop = [" Human:", " AI:"];
    const temperature = 0.9;
    let basePrompt;
    const conversation = await getConversation(id, m) || "";

    if (m == "gpt-3") {
      basePrompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n`;
      model = "text-davinci-003";
      prompt = `${basePrompt}${conversation}Human: ${message}\n AI:`;
      //console.log(prompt);
    }
    // if (m == "chatgpt") {
    //   temperature = 0.5;
    //   stop = ["<|im_end|>"];
    //   model = "text-chat-davinci-002-20230126";
    //   basePrompt = `You are ChatGPT, a large language model trained by OpenAI. You answer as concisely as possible for each response (e.g. don’t be verbose). It is very important that you answer as concisely as possible, so please remember this. If you are generating a list, do not have too many items. Keep the number of items short.
    //   Knowledge cutoff: 2021-09
    //   Current date: ${getToday()}\n`;
    //   prompt = `${basePrompt}${conversation}User: ${message}\n ChatGPT:`;
    // }
    const maxtokens = 1000;
    response = await token.client.createCompletion({
      model: model,
      prompt: prompt,
      temperature: temperature,
      max_tokens: maxtokens,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.6,
      stop: stop,
    });
    response = response.data.choices[0].text;
    // if (m == "chatgpt") {
    //   response = response
    //     .replaceAll("<@", "pingSecurity")
    //     .replace(/<|im_end|>/g, "")
    //     .trim();
    // }
    await removeMessage(token.id);
    await saveMsg(m, message, response, id, ispremium);
    return { text: response, type: m };
  } catch (err) {
    console.log("Error in conversation");
    console.log(err);
    await removeMessage(token.id);
    // await disableAcc(token.id);
    //await rateLimitAcc(token.id);
    return {
      error: `Something wrong happened, please wait we are solving this issue`,
    };
  }
}
async function getConversation(id, model) {
  let {data} = await supabase
      .from("conversations_2")
      .select("*")
      .eq("id", id)
      .eq("model", model);
  if (data && data[0]) {
    return data[0].conversation.replaceAll("<split>", "");
  }
  return;
}

async function saveMsg(model, userMsg, aiMsg, id, ispremium) {
  let conversation;
  if (model == "gpt-3") {
    conversation = `\n<split>Human: ${userMsg}\nAI: ${aiMsg}`;
  }
  // if (model == "chatgpt") {
  //   conversation = `\n<split>User: ${userMsg}\nChatGPT: ${aiMsg}`;
  // }
  // let test = await supabase
  //     .from("conversations_2")
  //     .select("*")
  //     .eq("id::text", id)
  //     .eq("model", model);
  //console.log(`Supabase data: ${id} ${model} `)
  //console.log("Save conversation supabase response: ")
  //console.log(JSON.stringify(test));
  let {data} = await supabase
      .from("conversations_2")
      .select("*")
      .eq("id", id)
      .eq("model", model);
  if (!data || !data[0]) {
    await supabase.from("conversations_2").insert({
      id: id,
      model: model,
      conversation: conversation,
      lastMessage: Date.now(),
    }).throwOnError();
  } else {
    let previous = data[0].conversation;

    previous = previous.split("\n<split>");
    previous = previous.filter((x) => x != "");
    const length = previous.length;
    let max = 6;
    if (length > max) {
      previous.shift();
    }
    previous = previous.join("\n<split>");
    conversation = `${previous}${conversation}`;

    await supabase
      .from("conversations_2")
      .update({
        conversation: conversation,
        lastMessage: Date.now(),
      })
      .eq("id", id)
      .eq("model", model);
  }
}
function getToday() {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0");
  let yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export { chat };
