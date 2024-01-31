import { Api, TelegramClient, utils } from "@telegram/gramjs";
import { customAlphabet } from "nanoid";
import { redis } from "@telegram/redis";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import mime from "mime-types";
import bigInt from "big-integer";
import { NewUpdateEvent } from "@telegram/types";
import { logger } from "@telegram/logger";
import {
  isChatCached,
  isUserCached,
  setChatCached,
  setUserCached,
} from "@telegram/utils";
import { Entity } from "@telegram/gramjs/dist/define";

function convertToJSON(obj: any) {
  const result: any = {};

  if (typeof obj !== "object" || obj === null) return obj;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (key == "originalArgs" || key[0] == "_") continue;

      if (value instanceof bigInt) {
        result[key] = value.toString();
      } else if (Array.isArray(value) || value instanceof Buffer) {
        result[key] = value.map(convertToJSON);
      } else if (typeof value === "object" && value !== null) {
        // Recursively handle ne sted objects
        result[key] = convertToJSON(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

export const nanoid = customAlphabet(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
);

const getFileId = (fileId: string) => redis.get(`file:${fileId}`);

const prefixes = {
  img: "img",
  doc: "doc",
} as const;

export function uuid(prefix: keyof typeof prefixes): string {
  return [prefixes[prefix], nanoid(16)].join("_");
}

let cdnEndpoint = "https://telegram-media.nyc3.cdn.digitaloceanspaces.com/";

const spacesEndpoint = "https://nyc3.digitaloceanspaces.com";
const spacesClient = new S3Client({
  endpoint: spacesEndpoint,
  region: "us-east-1", // Change to your region
  credentials: {
    accessKeyId: Bun.env.SPACES_ACCESS_KEY as string, // Replace with your Spaces access key
    secretAccessKey: Bun.env.SPACES_SECRET_KEY as string, // Replace with your Spaces secret key
  },
});

let chatSet = new Map<string, Entity>();

export const handleMessage = async (
  client: TelegramClient,
  message: Api.Message,
  { ignoreMedia = false, ignorePfp = false }
) => {
  const log = logger.child({
    messageId: message.id.toString(),
    chatId: utils.getPeerId(message.peerId),
  });

  let newUpdateEvent: NewUpdateEvent;

  log.debug(
    {
      text: message.text,
      totalEntities: message.entities?.length,
      totalMedia: message.media ? 1 : 0,
    },
    "Handling Message"
  );

  if (typeof message.getSender == "undefined") {
    log.debug("Message has no sender, ignoring");
    return true;
  }
  const sender = await message.getSender();

  const fromId = sender?.id.toString();

  let fromUserFull: (typeof newUpdateEvent)["fromUserFull"];

  if (fromId) {
    let pfpUrl: string | undefined;
    if (sender?.className == "User") {
      log.debug("Message is from a user");
      if (sender.photo?.className == "UserProfilePhoto" && !ignorePfp) {
        log.debug("Fetching user pfp");
        const photoExists = await redis.get(
          `pfp:${sender.photo.photoId.toString()}`
        );
        if (!photoExists) {
          const peerSender =
            (await message.getInputSender()) as Api.InputPeerUser;
          const buffer = await client.downloadProfilePhoto(peerSender, {
            // outputFile: "pfp.jpg",
          });
          const fileName = `${fromId}/${uuid("img")}.jpg`;
          const command = new PutObjectCommand({
            Bucket: "telegram-media", // Replace with your Space name
            Key: fileName,
            Body: buffer,
            ACL: "public-read",
          });

          const data = await spacesClient.send(command);
          await redis.set(`pfp:${sender.photo.photoId.toString()}`, fileName);
          log.debug(`Successfully uploaded pfp file: ${fileName}`);
          pfpUrl = `${cdnEndpoint}${fileName}`;
        } else {
          log.debug("Pfp already exists in cache");
          pfpUrl = `${cdnEndpoint}${photoExists}`;
        }
      }
      let description;
      if (!(await isUserCached(fromId))) {
        log.debug("User is not cached, caching now");
        const inputUser = await message.getInputSender();
        const userFull = await client.invoke(
          new Api.users.GetFullUser({ id: inputUser })
        );
        description = userFull.fullUser.about;

        await setUserCached(fromId);
      }
      fromUserFull = {
        id: fromId,
        firstName: sender.firstName,
        lastName: sender.lastName,
        username: sender.username,
        pfpUrl,
        description,
      };
    }
  } else {
    log.debug("Message has no fromId");
  }

  const dateInEpoch = new Date(message.date * 1000);
  const date = dateInEpoch.toISOString();

  const messageId = message.id.toString();

  const rawPeerId = utils.getPeerId(message.peerId);
  let chat: Entity;
  if (chatSet.get(rawPeerId)) {
    chat = chatSet.get(rawPeerId) as Entity;
  } else {
    chat = (await message.getChat()) as Entity;
    chatSet.set(rawPeerId, chat);
  }
  const peerId = chat?.id.toString();

  let fromChatFull: (typeof newUpdateEvent)["fromChatFull"];

  if (peerId) {
    const peer = chat;

    let chatPfpUrl: string | undefined;
    if (peer?.className == "Chat") {
      log.debug("Message is from a chat");
      if (peer.photo?.className == "ChatPhoto") {
        log.debug("Fetching chat pfp");
        const photoExists = await redis.get(
          `pfp:${peer.photo.photoId.toString()}`
        );
        if (!photoExists) {
          const peerSender =
            (await message.getInputChat()) as Api.InputPeerChat;
          const buffer = await client.downloadProfilePhoto(peerSender, {
            // outputFile: "pfp.jpg",
          });
          const fileName = `${peerId}/${uuid("img")}.jpg`;
          const command = new PutObjectCommand({
            Bucket: "telegram-media", // Replace with your Space name
            Key: fileName,
            Body: buffer,
            ACL: "public-read",
          });

          const data = await spacesClient.send(command);
          await redis.set(`pfp:${peer.photo.photoId.toString()}`, fileName);
          log.debug({ fileName }, `Successfully uploaded chat pfp`);
          chatPfpUrl = `${cdnEndpoint}${fileName}`;
        } else {
          log.debug("Pfp already exists in cache");
          chatPfpUrl = `${cdnEndpoint}${photoExists}`;
        }
      }

      let description;
      if (!(await isChatCached(peerId))) {
        log.debug("Chat is not cached, caching now");
        const chatsFull = await client.invoke(
          new Api.messages.GetFullChat({ chatId: peer.id })
        );
        description = chatsFull.fullChat?.about;

        await setChatCached(peerId);
      }

      fromChatFull = {
        id: peerId,
        isGroup: true,
        isChannel: false,
        title: peer.title,
        memberCount: peer.participantsCount,
        pfpUrl: chatPfpUrl,
        description,
      };
    } else if (peer?.className == "Channel") {
      log.debug("Message is from a channel");
      if (peer.photo?.className == "ChatPhoto" && !ignorePfp) {
        log.debug("Fetching channel pfp");
        const photoExists = await redis.get(
          `pfp:${peer.photo.photoId.toString()}`
        );
        if (!photoExists) {
          const peerSender =
            (await message.getInputChat()) as Api.InputPeerChannel;
          const buffer = await client.downloadProfilePhoto(peerSender, {
            // outputFile: "pfp.jpg",
          });
          const fileName = `${peerId}/${uuid("img")}.jpg`;
          const command = new PutObjectCommand({
            Bucket: "telegram-media", // Replace with your Space name
            Key: fileName,
            Body: buffer,
            ACL: "public-read",
          });

          const data = await spacesClient.send(command);
          await redis.set(`pfp:${peer.photo.photoId.toString()}`, fileName);
          log.debug({ fileName }, `Successfully uploaded channel pfp`);
          chatPfpUrl = `${cdnEndpoint}${fileName}`;
        } else {
          chatPfpUrl = `${cdnEndpoint}${photoExists}`;
          log.debug("Pfp already exists in cache");
        }
      }

      let description;
      if (!(await isChatCached(peerId))) {
        log.debug("Chat is not cached, caching now");
        const inputChannel = await message.getInputChat();
        const chatsFull = await client.invoke(
          new Api.channels.GetFullChannel({ channel: inputChannel })
        );
        description = chatsFull.fullChat?.about;

        await setChatCached(peerId);
      }

      fromChatFull = {
        id: peerId,
        isGroup: !!peer.megagroup,
        isChannel: true,
        title: peer.title,
        memberCount: peer.participantsCount,
        pfpUrl: chatPfpUrl,
        description,
      };
    } else if (peer?.className == "User") {
      log.debug("Message is from a user");
      fromChatFull = {
        id: peerId,
        isGroup: false,
        isChannel: false,
        title: `${peer.firstName} ${peer.lastName}`,
      };
    } else {
      log.error({ peerType: peer?.className }, "Unknown Peer Type");
      return;
    }
  } else {
    log.debug("Message has no peerId");
  }

  let media;
  let mediaId;
  if (message.media && !ignoreMedia) {
    if (
      message.media.className == "MessageMediaPhoto" &&
      message.media.photo?.className == "Photo"
    ) {
      log.debug("Message has photo media");
      let extension = "jpg";
      let fileId = message.media.photo?.id.toString();

      // const cachedFileId = await getFileId(fileId);
      // if (cachedFileId) {
      //   mediaId = cachedFileId;
      //   log.debug("Photo already exists in cache");
      // } else {
      const buffer = await message.downloadMedia();
      const fileName = `${fromId}/${uuid("img")}.${extension}`;
      const command = new PutObjectCommand({
        Bucket: "telegram-media", // Replace with your Space name
        Key: fileName,
        Body: buffer,
        ACL: "public-read",
      });

      const data = await spacesClient.send(command);
      media = {
        fileId,
        fileName,
        fileSize: -1,
        mimeType: "image/jpeg",
        fileUrl: `${cdnEndpoint}${fileName}`,
      };
      // console.log(command);
      log.debug({ fileName }, `Successfully uploaded photo`);
      //}
    } else if (message.media.className == "MessageMediaDocument") {
      log.debug("Message has document media");
      const document = message.media.document;

      if (document?.className == "Document") {
        let fileId = document?.id.toString();
        // const cachedFileId = await getFileId(fileId);
        // if (cachedFileId) {
        //   mediaId = cachedFileId;
        //   log.debug("Document already exists in cache");
        // } else {
        const attributes = document.attributes;
        const extension = mime.extension(document.mimeType);

        const fileNameAttr = attributes.find(
          (attribute) => attribute.className == "DocumentAttributeFilename"
        ) as Api.DocumentAttributeFilename;

        let fileName: string;

        if (!fileNameAttr) fileName = `${fromId}/${uuid("doc")}.${extension}`;
        else fileName = `${fromId}/${uuid("doc")}-${fileNameAttr.fileName}`;

        const buffer = await message.downloadMedia();

        const command = new PutObjectCommand({
          Bucket: "telegram-media", // Replace with your Space name
          Key: fileName,
          Body: buffer,
          ACL: "public-read",
        });

        const data = await spacesClient.send(command);
        // console.log(command);
        media = {
          fileId,
          fileName,
          fileSize: document.size.toJSNumber(),
          mimeType: document.mimeType,
          fileUrl: `${cdnEndpoint}${fileName}`,
        };
        log.debug({ fileName }, `Successfully uploaded document`);

        // console.log(`Successfully uploaded file: ${fileName}`);
        // }
      }
    }
  }

  let id = `chat-${peerId}-message-${messageId}`;

  const messageText = message.message;

  const groupId = message.groupedId?.toString();
  const inReplyToId = message.replyTo?.replyToMsgId?.toString();

  newUpdateEvent = {
    id,
    date,
    messageId,
    messageText,
    // fromUser: fromId,
    fromUserFull,
    toChat: id,
    fromChatFull,
    media,
    mediaId,
    groupId,
    inReplyToId,
    entities: JSON.stringify(message.entities?.map((o) => convertToJSON(o))),
  };

  return newUpdateEvent;
  // if (instanceof Api.UpdateNewChannelMessage) {
  //   console.log(JSON.stringify();
  // }
};
