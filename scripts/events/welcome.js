const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
  global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "1.7",
    author: "Messie Osango",
    category: "events"
  },

  langs: {
    en: {
      session1: "matin",
      session2: "midi",
      session3: "après-midi",
      session4: "soir",

      welcomeMessage:
        "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n" +
        "┃        🖤 BIENVENUE          ┃\n" +
        "┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n" +
        "┃ Merci de m’avoir invité      ┃\n" +
        "┃ dans ce groupe.              ┃\n" +
        "┃                              ┃\n" +
        "┃ PREFIX : %1                  ┃\n" +
        "┃ HELP   : %1help              ┃\n" +
        "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",

      multiple1: "toi",
      multiple2: "vous",

      defaultWelcomeMessage:
        "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n" +
        "┃        🖤 BIENVENUE          ┃\n" +
        "┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n" +
        "┃ Bonjour {userName},          ┃\n" +
        "┃                              ┃\n" +
        "┃ Tu es le bienvenu dans       ┃\n" +
        "┃ {boxName}.                   ┃\n" +
        "┃                              ┃\n" +
        "┃ Ici, le respect est une loi, ┃\n" +
        "┃ le silence a un sens,        ┃\n" +
        "┃ et chaque mot compte.        ┃\n" +
        "┃                              ┃\n" +
        "┃ Installe-toi tranquillement,┃\n" +
        "┃ observe et avance à ton      ┃\n" +
        "┃ rythme.                      ┃\n" +
        "┃                              ┃\n" +
        "┃ Passe un excellent {session}.┃\n" +
        "┃                              ┃\n" +
        "┃ 🌑 Que l’ombre te soit douce.┃\n" +
        "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    return async function () {
      const hours = getTime("HH");
      const { threadID } = event;
      const { nickNameBot } = global.GoatBot.config;
      const prefix = global.utils.getPrefix(threadID);
      const dataAddedParticipants = event.logMessageData.addedParticipants;

      // BOT AJOUTÉ AU GROUPE
      if (
        dataAddedParticipants.some(
          (item) => item.userFbId == api.getCurrentUserID()
        )
      ) {
        if (nickNameBot)
          api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
        return message.send(getLang("welcomeMessage", prefix));
      }

      if (!global.temp.welcomeEvent[threadID])
        global.temp.welcomeEvent[threadID] = {
          joinTimeout: null,
          dataAddedParticipants: []
        };

      global.temp.welcomeEvent[threadID].dataAddedParticipants.push(
        ...dataAddedParticipants
      );

      clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

      global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(
        async function () {
          const threadData = await threadsData.get(threadID);
          if (threadData.settings.sendWelcomeMessage == false) return;

          const added =
            global.temp.welcomeEvent[threadID].dataAddedParticipants;
          const banned = threadData.data.banned_ban || [];
          const threadName = threadData.threadName;

          const userName = [];
          const mentions = [];
          let multiple = added.length > 1;

          for (const user of added) {
            if (banned.some((i) => i.id == user.userFbId)) continue;
            userName.push(user.fullName);
            mentions.push({
              tag: user.fullName,
              id: user.userFbId
            });
          }

          if (!userName.length) return;

          let { welcomeMessage = getLang("defaultWelcomeMessage") } =
            threadData.data;

          const form = {
            mentions: welcomeMessage.includes("{userNameTag}")
              ? mentions
              : null
          };

          welcomeMessage = welcomeMessage
            .replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
            .replace(/\{boxName\}|\{threadName\}/g, threadName)
            .replace(
              /\{multiple\}/g,
              multiple ? getLang("multiple2") : getLang("multiple1")
            )
            .replace(
              /\{session\}/g,
              hours <= 10
                ? getLang("session1")
                : hours <= 12
                ? getLang("session2")
                : hours <= 18
                ? getLang("session3")
                : getLang("session4")
            );

          form.body = welcomeMessage;

          if (threadData.data.welcomeAttachment) {
            const files = threadData.data.welcomeAttachment;
            const attachments = files.map((f) =>
              drive.getFile(f, "stream")
            );
            form.attachment = (
              await Promise.allSettled(attachments)
            )
              .filter((i) => i.status === "fulfilled")
              .map((i) => i.value);
          }

          message.send(form);
          delete global.temp.welcomeEvent[threadID];
        },
        1500
      );
    };
  }
};
