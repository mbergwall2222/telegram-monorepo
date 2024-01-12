import Pusher from "pusher";

export const pusher = new Pusher({
  appId: Bun.env.PUSHER_APP_ID as string,
  key: Bun.env.PUSHER_KEY as string,
  secret: Bun.env.PUSHER_SECRET as string,
  cluster: Bun.env.PUSHER_CLUSTER as string,
  useTLS: Bun.env.PUSHER_USE_TLS == "true",
});
