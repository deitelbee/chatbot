import * as dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
//import { ChatGPTAPI } from 'chatgpt'
import { Configuration,OpenAIApi } from 'openai';

dotenv.config()

const { token, apikey, group_name } = process.env
const prefix = group_name ? '/' + group_name : '/gpt'

const bot = new TelegramBot(token, { polling: true });
//const api = new ChatGPTAPI({ apiKey })

const configuration = new Configuration({
  apiKey:apikey
});

const openai = new OpenAIApi(configuration);

console.log(new Date().toLocaleString(), '--Bot has been started...');



bot.on('text', async (msg) => {
  console.log(new Date().toLocaleString(), '--Received message from id:', msg.chat.id, ':', msg.text);
  await msgHandler(msg);
});

async function msgHandler(msg) {
  if (typeof msg.text !== 'string' || ((msg.chat.type === 'group' || msg.chat.type === 'supergroup') && !msg.text.startsWith(prefix))) {
    return;
  }
  if(msg.text.startsWith('/start')){
    await bot.sendMessage(msg.chat.id, '👋你好！很高兴能与您交谈。有什么我可以帮您的吗？');
  }else if(msg.text.startsWith('prefix')){
    await chatGpt(msg);
  }else{
    await bot.sendMessage(msg.chat.id, '😭我不太明白您的意思。');
  }
}

async function chatGpt(msg) {
  try {
    const tempId = (await bot.sendMessage(msg.chat.id, '🤔正在组织语言，请稍等...', {
      reply_to_message_id: msg.message_id
    })).message_id;
    bot.sendChatAction(msg.chat.id, 'typing');
    //const response = await api.sendMessage(msg.text.replace(prefix, ''))
    const prompt = msg.text.replace(prefix, '');
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
      //stop:["\"\"\""],
  });
  const message = response.data.choices[0].text;
  console.log(new Date().toLocaleString(), '--AI response to <', msg.text, '>:', message);
  await bot.editMessageText(message, { parse_mode: 'Markdown', chat_id: msg.chat.id, message_id: tempId });
  } catch (err) {
    console.log('Error:', err)
    await bot.sendMessage(msg.chat.id, '😭出错了，请稍后再试；如果您是管理员，请检查日志。');
    //throw err
  }
}