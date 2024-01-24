import { Kafka, logLevel } from "@telegram/kafkajs";
import { SchemaRegistry } from "@kafkajs/confluent-schema-registry";

export const kafka = new Kafka({
  clientId: "my-app",
  brokers: [
    "redpanda-0.redpanda.redpanda.svc.cluster.local:9093",
    "redpanda-1.redpanda.redpanda.svc.cluster.local:9093",
    "redpanda-2.redpanda.redpanda.svc.cluster.local:9093",
  ], // Replace with your Kafka broker
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 30000,
  // sasl: {
  //   mechanism: "scram-sha-256", // Replace with your SASL mechanism
  //   username: "bWFnbmV0aWMtbGl6YXJkLTkwMDUkuns1jdFHEyVWa5oEmNwcTUi3mFOFIGdP03Y", // Replace username
  //   password: "MWIyMzRjNzYtYzkwOS00ZWIyLWFhNTQtZWZjZDFiNTFjYzU4", // Replace with your password
  // },
  logLevel: logLevel.ERROR,
});
