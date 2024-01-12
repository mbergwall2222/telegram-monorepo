FROM oven/bun:1 AS base
COPY ./dist/* .
EXPOSE 9000
EXPOSE 9090
CMD ["bun", "run", "index.js"]
