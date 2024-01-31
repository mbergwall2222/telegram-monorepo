import { Api } from "@telegram/gramjs";
import { Entity } from "@telegram/gramjs/dist/define";
import bigInt from "big-integer";
import { TakeoutClient } from "./TakeoutClient";

export type Serialized<T> = {
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

export const convertToMessage = (
  serialized: Serialized<Api.Message> & { entity?: Serialized<Entity> },
  client: TakeoutClient
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
    const convertedSender = convertObject(sender);
    client._entityCache.add([convertedSender]);
    entities.set(newMessage.senderId?.toString(), convertedSender);
  }
  if (chat) {
    const convertedChat = convertObject(chat);

    client._entityCache.add([convertedChat]);
    entities.set(newMessage.chatId?.toString(), convertedChat);
  }
  // console.log(entities);

  try {
    newMessage._finishInit(client, entities);
  } catch (e) {}
  // newMessage._senderId = ""

  return newMessage;
};
