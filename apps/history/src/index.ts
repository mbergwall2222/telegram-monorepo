import EventEmitter from "events";
import { main } from "./handler";

const eventEmitter = new EventEmitter();

eventEmitter.on("progress", () => {
  console.log("GOT PROGRESS");
  eventEmitter.emit("progress_back");
});
try {
  await main();
} catch (e) {
  console.log(e);
  console.log("SHUTTING DOWN");
}
