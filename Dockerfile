FROM node:14-slim

WORKDIR /home/node/app

COPY package.json .

RUN npm install

COPY action.yml .
COPY index.js .

CMD ["node", "/home/node/app/index.js"]
