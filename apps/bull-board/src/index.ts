import { env } from "@telegram/env";
import { Queue } from "bullmq";

const express = require("express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const queueNames = ["{history-messages}", "{history-results}", "{history-queue}", "{history-messages-2}", "{history-results-2}", "{history-queue-2}"];

const queues = queueNames.map(queueName => new Queue(queueName, {
  connection: {
    host: env.REDIS_URL.split(":")[1].replace("//", ""),
  },
}))



const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: queues.map(queue => new BullMQAdapter(queue)),
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
