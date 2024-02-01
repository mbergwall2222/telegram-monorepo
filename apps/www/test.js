const PusherJS = require("pusher-js");

let client = new PusherJS("app-key", {
  wsHost: "x21-ws.mattbergwall.com",
  cluster: "",
  wsPort: 80,
  forceTLS: true,
  disableStats: true,
  enabledTransports: ["ws", "wss"],
});

client.connection.bind("state_change", function (states) {
  var prevState = states.previous;
  var currState = states.current;
  console.log(prevState, currState);
});

client.connection.bind("connection_established", () => {
  console.log("here");
  if (pusher.connection.state === "connected") {
    // Subscribe to channels
  } else {
    // Retry the connection
  }
});
client.subscribe("chat-room").bind("message", (message) => {
  alert(`${message.sender} says: ${message.content}`);
});

console.log(client.connection.state);
