FROM node:14-slim

RUN mkdir /github && mkdir /github/workspace
WORKDIR /github/workspace

COPY . .

RUN npm install

CMD ["npm", "start"]
