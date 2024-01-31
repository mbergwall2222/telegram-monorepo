import data from "./export.json";

Bun.write("messages.json", JSON.stringify(data.data));
