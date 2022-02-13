FROM node:16
WORKDIR /usr/src/app

COPY . .
RUN npm install

EXPOSE 2008
CMD [ "npx", "ts-node", "relay.ts", "--fee", "420", "--network", "devnet" ]

