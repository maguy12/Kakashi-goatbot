const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const doNotDelete =
  "┌──────────────────────────────┐\n" +
  "│   GOATBOT :: HACKER MODE     │\n" +
  "└──────────────────────────────┘";

function applyFont(text) {
  const fontMap = {
    'A':'𝙰','B':'𝙱','C':'𝙲','D':'𝙳','E':'𝙴','F':'𝙵','G':'𝙶','H':'𝙷','I':'𝙸','J':'𝙹','K':'𝙺','L':'𝙻',
    'M':'𝙼','N':'𝙽','O':'𝙾','P':'𝙿','Q':'𝚀','R':'𝚁','S':'𝚂','T':'𝚃','U':'𝚄','V':'𝚅','W':'𝚆','X':'𝚇',
    'Y':'𝚈','Z':'𝚉',
    'a':'𝚊','b':'𝚋','c':'𝚌','d':'𝚍','e':'𝚎','f':'𝚏','g':'𝚐','h':'𝚑','i':'𝚒','j':'𝚓','k':'𝚔','l':'𝚕',
    'm':'𝚖','n':'𝚗','o':'𝚘','p':'𝚙','q':'𝚚','r':'𝚛','s':'𝚜','t':'𝚝','u':'𝚞','v':'𝚟','w':'𝚠','x':'𝚡',
    'y':'𝚢','z':'𝚣'
  };
  return text.split("").map(c => fontMap[c] || c).join("");
}

module.exports = {
  config: {
    name: "help",
    version: "1.2",
    author: "messie osango",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Command list (hacker style)"
    },
    longDescription: {
      en: "View all commands in hacker dark terminal style"
    },
    category: "info",
    guide: {
      en: "{pn} [command_name]"
    },
    priority: 1
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = await getPrefix(event.threadID);

    if (!args[0]) {
      const categories = {};
      let msg =
        "┌────────────────────────────────┐\n" +
        "│   🧠 GOATBOT TERMINAL ONLINE   │\n" +
        "├────────────────────────────────┤\n" +
        "│ > Access granted               │\n" +
        "│ > Dark protocol enabled        │\n" +
        "└────────────────────────────────┘\n\n";

      for (const [name, value] of commands) {
        if (value.config.role > role) continue;
        const category = value.config.category || "NO CATEGORY";
        if (!categories[category]) categories[category] = [];
        categories[category].push(name);
      }

      Object.keys(categories).sort().forEach(cat => {
        msg +=
          "┌──────────────────────────────┐\n" +
          `│ ${applyFont(cat.toUpperCase())}\n` +
          "├──────────────────────────────┤\n";
        categories[cat].sort().forEach(cmd => {
          msg += `│ ▸ ${applyFont(cmd)}\n`;
        });
        msg += "└──────────────────────────────┘\n\n";
      });

      msg +=
        "┌──────────────────────────────┐\n" +
        `│ TOTAL_CMDS : ${commands.size}\n` +
        `│ PREFIX     : ${prefix}\n` +
        `│ HELP_CMD   : ${prefix}help <cmd>\n` +
        "└──────────────────────────────┘\n\n" +
        doNotDelete;

      return message.reply(msg);
    }

    const name = args[0].toLowerCase();
    const command =
      commands.get(name) || commands.get(aliases.get(name));

    if (!command) {
      return message.reply(
        "┌──────────────────────────────┐\n" +
        "│ ERROR :: COMMAND NOT FOUND   │\n" +
        "└──────────────────────────────┘"
      );
    }

    const cfg = command.config;

    const response =
      "┌────────────────────────────────┐\n" +
      "│   COMMAND :: INFORMATION       │\n" +
      "├────────────────────────────────┤\n" +
      `│ NAME     : ${cfg.name}\n` +
      `│ VERSION  : ${cfg.version || "1.0"}\n` +
      `│ AUTHOR   : ${applyFont(cfg.author || "Unknown")}\n` +
      "├────────────────────────────────┤\n" +
      "│ DESCRIPTION:\n" +
      `│ ${cfg.longDescription?.en || "No description"}\n` +
      "├────────────────────────────────┤\n" +
      "│ USAGE:\n" +
      `│ ${(cfg.guide?.en || "No guide")
        .replace(/{pn}/g, prefix)}\n` +
      "├────────────────────────────────┤\n" +
      `│ ROLE     : ${roleTextToString(cfg.role)}\n` +
      `│ COOLDOWN : ${cfg.countDown || 2}s\n` +
      `│ ALIASES  : ${cfg.aliases ? cfg.aliases.join(", ") : "None"}\n` +
      "└────────────────────────────────┘";

    return message.reply(response);
  }
};

function roleTextToString(role) {
  switch (role) {
    case 0: return applyFont("All users");
    case 1: return applyFont("Group admins");
    case 2: return applyFont("Bot admins");
    default: return applyFont("Unknown");
  }
        }
