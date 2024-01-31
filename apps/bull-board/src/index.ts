import { env } from "@telegram/env";
import { Queue } from "bullmq";

const express = require("express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const queue = new Queue("{history-messages}", {
  connection: {
    host: env.REDIS_URL.split(":")[1].replace("//", ""),
  },
});
const queue2 = new Queue("{history-results}", {
  connection: {
    host: env.REDIS_URL.split(":")[1].replace("//", ""),
  },
});
const queue3 = new Queue("{history-queue}", {
  connection: {
    host: env.REDIS_URL.split(":")[1].replace("//", ""),
  },
});
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(queue),
    new BullMQAdapter(queue2),
    new BullMQAdapter(queue3),
  ],
  serverAdapter: serverAdapter,
});

const app = express();

app.use("/admin/queues", serverAdapter.getRouter());

// other configurations of your server

app.listen(3000, () => {
  console.log("Running on 3000...");
  console.log("For the UI, open http://localhost:3000/admin/queues");
  console.log("Make sure Redis is running on port 6379 by default");
});
