const axios = require('axios');
const validUrl = require('valid-url');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";
const TMP_DIR = path.join(__dirname, 'tmp');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
};

function makeFrame(text) {
  const signature = "💀 Merci d’utiliser OCTAVIO DARK BOT — Créé par Octavio Dark.";
  const lines = [...text.split("\n"), "", signature];
  const maxLen = Math.max(...lines.map(l => l.length));
  const top = "╭" + "─".repeat(maxLen + 2) + "╮";
  const bottom = "╰" + "─".repeat(maxLen + 2) + "╯";
  const body = lines.map(l => "│ " + l.padEnd(maxLen) + " │").join("\n");
  return `${top}\n${body}\n${bottom}`;
};

const resetConversation = async (api, event, message) => {
  api.setMessageReaction("♻️", event.messageID, () => {}, true);
  try {
    await axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`);
    return message.reply(makeFrame(`✅ Conversation reset for UID: ${event.senderID}`));
  } catch (error) {
    console.error('❌ Reset Error:', error.message);
    return message.reply(makeFrame("❌ Reset failed. Try again."));
  }
};

const handleAIRequest = async (api, event, userInput, message, isReply = false) => {
  const userId = event.senderID;
  let messageContent = userInput;
  let imageUrl = null;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  if (event.messageReply) {
    const replyData = event.messageReply;
    if (replyData.senderID !== global.GoatBot?.botID && replyData.body) {
      const trimmedReply = replyData.body.length > 300 ? replyData.body.slice(0,300)+"..." : replyData.body;
      messageContent += `\n\n📌 Reply:\n"${trimmedReply}"`;
    }
    const attachment = replyData.attachments?.[0];
    if (attachment?.type === 'photo') imageUrl = attachment.url;
  }

  const urlMatch = messageContent.match(/(https?:\/\/[^\s]+)/)?.[0];
  if (urlMatch && validUrl.isWebUri(urlMatch)) {
    imageUrl = urlMatch;
    messageContent = messageContent.replace(urlMatch, '').trim();
  }

  if (!messageContent && !imageUrl) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply(makeFrame("💬 Provide a message or image."));
  }

  try {
    const response = await axios.post(
      API_ENDPOINT,
      { uid: userId, message: messageContent, image_url: imageUrl },
      { timeout: 60000 }
    );

    const { reply: textReply, image_url: genImageUrl, music_data: musicData, video_data: videoData, shotti_data: shotiData, lyrics_data: lyricsData } = response.data;

    let finalReply = textReply || '✅ AI Response:';
    const attachments = [];

    if (genImageUrl) try { attachments.push(fs.createReadStream(await downloadFile(genImageUrl, 'jpg'))); finalReply = `🖼️ Image générée\n\n${finalReply}`; } catch { finalReply += '\n🖼️ Image download failed.'; }
    if (musicData?.downloadUrl) try { attachments.push(fs.createReadStream(await downloadFile(musicData.downloadUrl, 'mp3'))); finalReply = `🎵 Music\n\n${finalReply}`; } catch { finalReply += '\n🎵 Music download failed.'; }
    if (videoData?.downloadUrl) try { attachments.push(fs.createReadStream(await downloadFile(videoData.downloadUrl, 'mp4'))); finalReply = `🎬 Video\n\n${finalReply}`; } catch { finalReply += '\n🎬 Video download failed.'; }
    if (shotiData?.videoUrl) try { attachments.push(fs.createReadStream(await downloadFile(shotiData.videoUrl, 'mp4'))); finalReply = `🎬 Shoti\n\n${finalReply}`; } catch { finalReply += '\n🎬 Shoti video download failed.'; }
    if (lyricsData) try { let lyricsText = lyricsData.lyrics; if (lyricsText.length>1500) lyricsText=lyricsText.substring(0,1500)+'... [truncated]'; finalReply += `\n\n🎵 Lyrics for "${lyricsData.track_name}":\n${lyricsText}`; } catch { finalReply += '\n📝 Lyrics processing failed.'; }

    const sentMessage = await message.reply({ body: makeFrame(finalReply), attachment: attachments.length>0?attachments:undefined });

    if (sentMessage?.messageID) {
      global.GoatBot.onReply.set(sentMessage.messageID, { commandName: 'ai', messageID: sentMessage.messageID, author: userId });
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (error) {
    console.error("❌ API Error:", error.response?.data || error.message);
    api.setMessageReaction("❌", event.messageID, () => {}, true);

    let errorMessage = "⚠️ AI Error:\n\n";
    if (error.code==='ECONNABORTED'||error.message.includes('timeout')) errorMessage+="⏱️ Timeout. Try again.";
    else if (error.response?.status===429) errorMessage+="🚦 Too many requests. Slow down.";
    else errorMessage+="❌ Unexpected error: "+(error.message||'No details');

    return message.reply(makeFrame(errorMessage));
  }
};

module.exports = {
  config: {
    name: 'ai',
    aliases: [],
    version: '2.3.0',
    author: 'Octavio Dark',
    role: 0,
    category: 'ai',
    longDescription: { en: 'Advanced AI with image, music, video, lyrics, Shoti' },
    guide: { en: `.ai [message] • Chat, Image, Music, Video, Lyrics, Shoti • Reply "clear" to reset` }
  },

  onStart: async function({ api, event, args, message }) {
    const userInput = args.join(' ').trim();
    if (!userInput) return message.reply(makeFrame("❗ Please enter a message."));
    if (['clear','reset'].includes(userInput.toLowerCase())) return await resetConversation(api,event,message);
    return await handleAIRequest(api,event,userInput,message);
  },

  onReply: async function({ api, event, Reply, message }) {
    if (event.senderID!==Reply.author) return;
    const userInput = event.body?.trim();
    if (!userInput) return;
    if (['clear','reset'].includes(userInput.toLowerCase())) return await resetConversation(api,event,message);
    return await handleAIRequest(api,event,userInput,message,true);
  },

  onChat: async function({ api, event, message }) {
    const body = event.body?.trim();
    if (!body?.toLowerCase().startsWith('ai ')) return;
    const userInput = body.slice(3).trim();
    if (!userInput) return;
    return await handleAIRequest(api,event,userInput,message);
  }
};
