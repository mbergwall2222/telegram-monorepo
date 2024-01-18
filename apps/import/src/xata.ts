import { getXataClient } from "@telegram/xata";

const xata = getXataClient();

const messages = await xata.db.messages
  .select(["*", "fromUser.*", "toChat.*", "media.*"])
  .getPaginated({ pagination: { size: 1000 } });

console.log(messages.meta);
