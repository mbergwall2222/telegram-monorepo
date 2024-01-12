import pino from "pino";

export const logger = pino({
  // transport: {
  //   // target: "pino-pretty",
  // },
  level: Bun.env.NODE_ENV === "production" ? "info" : "debug",
});
