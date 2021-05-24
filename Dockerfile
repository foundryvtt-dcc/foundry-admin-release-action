FROM node:14

RUN apt-get update
RUN apt-get install libnss3-dev

WORKDIR /home/node/app

COPY package.json .

RUN npm install

COPY action.yml .
COPY index.js .

CMD ["node", "/home/node/app/index.js"]
