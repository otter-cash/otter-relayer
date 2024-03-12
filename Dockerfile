FROM node:16
WORKDIR /usr/src/app

# Copy files and install node modules.
COPY package*.json ./
# RUN npm install -g npm
RUN npm install
COPY ./ ./

# Copy wallet private key.
ENV ANCHOR_WALLET=./wallet.json

EXPOSE 2008
ENTRYPOINT [ "npx", "ts-node", "relay.ts" ]

