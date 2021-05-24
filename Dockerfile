FROM node:14-slim

WORKDIR /home/node/app

COPY . .

RUN npm install

CMD ["node", "index.js"]
