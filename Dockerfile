FROM node:14-slim

WORKDIR /home/node/app

COPY . .

RUN npm install

ENTRYPOINT ["npm", "start"]
