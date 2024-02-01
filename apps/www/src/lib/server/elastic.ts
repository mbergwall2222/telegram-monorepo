import { env } from "@/env.mjs";
import { Client } from "@elastic/elasticsearch";

export const elasticClient = new Client({
  node: env.ELASTICSEARCH_URL,
  auth: {
    apiKey: env.ELASTICSEARCH_API_KEY,
  },
  tls: { rejectUnauthorized: false },
});
