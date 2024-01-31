FROM node:18-alpine
COPY ./dist/index.js .
COPY ./dist/package.json .
EXPOSE 9000
EXPOSE 9090
CMD ["node", "index.js"]
