const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    aliases: ["🌚"],
    version: "1.3",
    author: "messie osango",
    countDown: 5,
    role: 0,
    shortDescription: "Changer le préfixe du bot",
    longDescription:
      "Change le symbole de commande du bot (discussion ou système global)",
    category: "box chat",
    guide: {
      fr:
        "┌──────────────────────────┐\n" +
        "│      PREFIX :: HACKER    │\n" +
        "└──────────────────────────┘\n" +
        "{pn} <nouveau_prefix>\n" +
        "Ex : {pn} #\n\n" +
        "{pn} <nouveau_prefix> -g\n" +
        "Ex : {pn} # -g\n\n" +
        "{pn} reset"
    }
  },

  langs: {
    fr: {
      reset: "✔ PREFIX RESET → %1",
      onlyAdmin: "⛔ ACCÈS REFUSÉ : ADMIN SEULEMENT",
      confirmGlobal: "⚠ CONFIRMER MODIFICATION PREFIX GLOBAL",
      confirmThisThread: "⚠ CONFIRMER MODIFICATION PREFIX LOCAL",
      successGlobal: "✔ PREFIX GLOBAL APPLIQUÉ → %1",
      successThisThread: "✔ PREFIX LOCAL APPLIQUÉ → %1"
    }
  },

  onStart: async function ({ message, role, args, event, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();

    const newPrefix = args[0];
    const isGlobal = args.includes("-g");

    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    if (isGlobal) {
      if (role < 2) return message.reply(getLang("onlyAdmin"));
      return message.reply({
        body: getLang("confirmGlobal"),
        reaction: {
          author: event.userID,
          newPrefix,
          setGlobal: true
        }
      });
    }

    return message.reply({
      body: getLang("confirmThisThread"),
      reaction: {
        author: event.userID,
        newPrefix,
        setGlobal: false
      }
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(
        global.client.dirConfig,
        JSON.stringify(global.GoatBot.config, null, 2)
      );
      return message.reply(getLang("successGlobal", newPrefix));
    }

    await threadsData.set(event.threadID, newPrefix, "data.prefix");
    return message.reply(getLang("successThisThread", newPrefix));
  },

  onChat: async function ({ event, message }) {
    if (
      event.body &&
      (event.body.toLowerCase() === "prefix" ||
        event.body.toLowerCase() === "🌚")
    ) {
      const sysPrefix = global.GoatBot.config.prefix;
      const boxPrefix = await utils.getPrefix(event.threadID);

      return message.reply(
        "┌────────────────────────────────┐\n" +
        "│   🧠 GOATBOT :: OCTAVIO     │\n" +
        "├────────────────────────────────┤\n" +
        "│ > Access granted               │\n" +
        "│ > System online                │\n" +
        "│ > Dark protocol active         │\n" +
        "├────────────────────────────────┤\n" +
        `│ PREFIX_SYS  :: ${sysPrefix}\n` +
        `│ PREFIX_BOX  :: ${boxPrefix}\n` +
        "├────────────────────────────────┤\n" +
        `│ CMD_HELP    :: ${boxPrefix}help\n` +
        "├────────────────────────────────┤\n" +
        "│ « Code is law. Silence obeys. »│\n" +
        "└────────────────────────────────┘"
      );
    }
  }
};
