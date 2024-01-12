import { Kafka, logLevel } from "kafkajs";
import { Kafka as UpstashKafka } from "@upstash/kafka";

export const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["magnetic-lizard-9005-us1-kafka.upstash.io:9092"], // Replace with your Kafka broker
  ssl: true,
  sasl: {
    mechanism: "scram-sha-256", // Replace with your SASL mechanism
    username: "bWFnbmV0aWMtbGl6YXJkLTkwMDUkuns1jdFHEyVWa5oEmNwcTUi3mFOFIGdP03Y", // Replace username
    password: "MWIyMzRjNzYtYzkwOS00ZWIyLWFhNTQtZWZjZDFiNTFjYzU4", // Replace with your password
  },
  logLevel: logLevel.ERROR,
});

export const upstashKafka = new UpstashKafka({
  url: "https://magnetic-lizard-9005-us1-rest-kafka.upstash.io",
  username: "bWFnbmV0aWMtbGl6YXJkLTkwMDUkuns1jdFHEyVWa5oEmNwcTUi3mFOFIGdP03Y",
  password: "MWIyMzRjNzYtYzkwOS00ZWIyLWFhNTQtZWZjZDFiNTFjYzU4",
});
