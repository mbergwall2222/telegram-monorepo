import { Api, sessions } from "@telegram/gramjs";
import bigInt from "big-integer";
import { TakeoutClient } from "./TakeoutClient";
import { env } from "@telegram/env";
import { Entity } from "@telegram/gramjs/dist/define";
const { StoreSession, StringSession, MemorySession, RedisSession } = sessions;
const session = new RedisSession(env.SESSION);
// const session = new MemorySession();

await session.load();
type Serialized<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? undefined
    : T[P] extends boolean | number | undefined | string | null | Entity
      ? T[P]
      : T[P] extends bigInt.BigInteger
        ? string
        : T[P] extends object
          ? Serialized<T[P]>
          : string;
};

type ExcludeSymbolKeys<T> = {
  [P in keyof T as P extends symbol ? never : P]: T[P];
};

type SerializedValue<T> = T extends object
  ? {
      [P in keyof ExcludeSymbolKeys<T>]: SerializedValue<T[P]>;
    }[keyof ExcludeSymbolKeys<T>]
  : T;

const convertToMessage = (
  serialized: Serialized<Api.Message> & { entity?: Serialized<Entity> }
) => {
  const params: Record<string, any> = {};

  const convertObject = (val: any | any[]): any => {
    if (Array.isArray(val)) {
      return val.map(convertObject);
    } else if (val instanceof bigInt) {
      return val.toString();
    } else if (typeof val === "object") {
      if (typeof val?.className != "undefined") {
        const vals = Object.keys(val).reduce((acc, key) => {
          acc[key] = convertObject(val[key]);
          return acc;
        }, {} as any);
        // @ts-expect-error we validate this
        if (!Api[val.className]) {
          console.log(val);
          throw new Error("Unknown object");
        }
        // @ts-expect-error we validate this
        const obj = new Api[val.className](vals);
        return obj;
      } else if (val == null) return val;
      else if (val?.type == "Buffer") {
        return Buffer.from(val.data);
      } else {
        console.log(val);
        throw new Error("Unknown object");
      }
    } else if (typeof val == "string" && val.startsWith("B|")) {
      return bigInt(val.slice(2));
    } else {
      return val;
    }
  };

  Object.keys(serialized).forEach((key) => {
    // @ts-expect-error
    params[key] = convertObject(serialized[key]);
  });

  // @ts-expect-error
  const newMessage = new Api.Message(params);

  const sender = serialized._sender as Entity;
  const chat = serialized._chat as Entity;

  const entities = new Map();

  // console.log("Sender", sender);
  if (sender) {
    console.log("HERE");
    const convertedSender = convertObject(sender);
    client._entityCache.add([convertedSender]);
    entities.set(newMessage.senderId?.toString(), convertedSender);
  } else console.log("NO SENDER");
  if (chat) {
    const convertedChat = convertObject(chat);

    client._entityCache.add([convertedChat]);
    entities.set(newMessage.chatId?.toString(), convertedChat);
  }
  // console.log(entities);

  newMessage._finishInit(client, entities);
  // newMessage._senderId = ""

  return newMessage;
};

const apiId = env.TELEGRAM_API_ID;
const apiHash = env.TELEGRAM_APP_HASH;

const client = new TakeoutClient(
  bigInt("3131715400446398391"),
  session,
  apiId,
  apiHash,
  {
    connectionRetries: 5,
  }
);

await client.start({
  phoneNumber: async () => "",
  password: async () => "",
  phoneCode: async () => "",
  onError: (err) => console.log(err),
  firstAndLastNames: async () => {
    console.log("firstAndLastNames");
    const ev: any = "";
    return ev;
  },
  qrCode: async () => {
    console.log("qrCode");
    const ev: any = "";
    return ev;
  },
});

const message = await convertToMessage({
  CONSTRUCTOR_ID: 1992213009,
  SUBCLASS_OF_ID: 2030045667,
  className: "Message",
  classType: "constructor",
  out: false,
  mentioned: false,
  mediaUnread: false,
  silent: false,
  post: false,
  fromScheduled: false,
  legacy: false,
  editHide: false,
  ttlPeriod: null,
  id: 500000,
  fromId: {
    CONSTRUCTOR_ID: 1498486562,
    SUBCLASS_OF_ID: 47470215,
    className: "PeerUser",
    classType: "constructor",
    userId: "B|1658629522",
  },
  peerId: {
    CONSTRUCTOR_ID: 2728736542,
    SUBCLASS_OF_ID: 47470215,
    className: "PeerChannel",
    classType: "constructor",
    channelId: "B|1379671793",
  },
  fwdFrom: null,
  viaBotId: null,
  replyTo: {
    CONSTRUCTOR_ID: 2948336091,
    SUBCLASS_OF_ID: 1531810151,
    className: "MessageReplyHeader",
    classType: "constructor",
    flags: 18,
    replyToScheduled: false,
    forumTopic: false,
    quote: false,
    replyToMsgId: 499997,
    replyToPeerId: null,
    replyFrom: null,
    replyMedia: null,
    replyToTopId: 499992,
    quoteText: null,
    quoteEntities: null,
    quoteOffset: null,
  },
  date: 1616347243,
  message: "ь",
  media: null,
  replyMarkup: null,
  entities: null,
  views: null,
  forwards: null,
  replies: null,
  editDate: null,
  pinned: false,
  postAuthor: null,
  groupedId: null,
  restrictionReason: null,
  noforwards: false,
  reactions: null,
  _inputChat: {
    CONSTRUCTOR_ID: 666680316,
    SUBCLASS_OF_ID: 3374092470,
    className: "InputPeerChannel",
    classType: "constructor",
    channelId: "B|1379671793",
    accessHash: "B|6257506618268838914",
  },
  _chat: {
    CONSTRUCTOR_ID: 179174543,
    SUBCLASS_OF_ID: 3316604308,
    className: "Channel",
    classType: "constructor",
    flags: 8659200,
    creator: false,
    left: false,
    broadcast: false,
    verified: false,
    megagroup: true,
    restricted: false,
    signatures: false,
    min: false,
    scam: false,
    hasLink: false,
    hasGeo: false,
    slowmodeEnabled: false,
    callActive: true,
    callNotEmpty: false,
    fake: false,
    gigagroup: false,
    noforwards: false,
    joinToSend: false,
    joinRequest: false,
    forum: false,
    flags2: 8,
    storiesHidden: false,
    storiesHiddenMin: false,
    storiesUnavailable: true,
    id: "B|1379671793",
    accessHash: "B|6257506618268838914",
    title: "PPTeam",
    username: null,
    photo: {
      CONSTRUCTOR_ID: 476978193,
      SUBCLASS_OF_ID: 2889794789,
      className: "ChatPhoto",
      classType: "constructor",
      flags: 2,
      hasVideo: false,
      photoId: "B|5118715833118469598",
      strippedThumb: {
        type: "Buffer",
        data: [1, 8, 8, 205, 119, 141, 161, 57, 39, 204, 205, 20, 81, 64, 31],
      },
      dcId: 1,
    },
    date: 1704491707,
    restrictionReason: null,
    adminRights: null,
    bannedRights: null,
    defaultBannedRights: {
      CONSTRUCTOR_ID: 2668758040,
      SUBCLASS_OF_ID: 1263814057,
      className: "ChatBannedRights",
      classType: "constructor",
      flags: 17171840,
      viewMessages: false,
      sendMessages: false,
      sendMedia: false,
      sendStickers: false,
      sendGifs: false,
      sendGames: false,
      sendInline: false,
      embedLinks: true,
      sendPolls: true,
      changeInfo: true,
      inviteUsers: false,
      pinMessages: true,
      manageTopics: true,
      sendPhotos: false,
      sendVideos: false,
      sendRoundvideos: false,
      sendAudios: false,
      sendVoices: false,
      sendDocs: true,
      sendPlain: false,
      untilDate: 2147483647,
    },
    participantsCount: null,
    usernames: null,
    storiesMaxId: null,
    color: null,
    profileColor: null,
    emojiStatus: null,
    level: null,
  },
  _sender: {
    CONSTRUCTOR_ID: 559694904,
    SUBCLASS_OF_ID: 765557111,
    className: "User",
    classType: "constructor",
    flags: 8193,
    self: false,
    contact: false,
    mutualContact: false,
    deleted: true,
    bot: false,
    botChatHistory: false,
    botNochats: false,
    verified: false,
    restricted: false,
    min: false,
    botInlineGeo: false,
    support: false,
    scam: false,
    applyMinPhoto: false,
    fake: false,
    botAttachMenu: false,
    premium: false,
    attachMenuEnabled: false,
    flags2: 0,
    botCanEdit: false,
    closeFriend: false,
    storiesHidden: false,
    storiesUnavailable: false,
    contactRequirePremium: false,
    id: "B|1658629522",
    accessHash: "B|-8303100639497036403",
    firstName: null,
    lastName: null,
    username: null,
    phone: null,
    photo: null,
    status: null,
    botInfoVersion: null,
    restrictionReason: null,
    botInlinePlaceholder: null,
    langCode: null,
    emojiStatus: null,
    usernames: null,
    storiesMaxId: null,
    color: null,
    profileColor: null,
  },
  _inputSender: {
    CONSTRUCTOR_ID: 3723011404,
    SUBCLASS_OF_ID: 3374092470,
    className: "InputPeerUser",
    classType: "constructor",
    userId: "B|1658629522",
    accessHash: "B|-8303100639497036403",
  },
  flags: 264,
  invertMedia: false,
  savedPeerId: null,
});

console.log(await message.getSender());
