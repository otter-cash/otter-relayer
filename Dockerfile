FROM node:16
WORKDIR /usr/src/app

# Copy files and install node modules.
COPY package*.json ./
RUN npm install
COPY ./ ./

# Copy wallet private key.
ENV ANCHOR_WALLET=./wallet.json

EXPOSE 2008
ENTRYPOINT [ "npx" ]
CMD [ "ts-node", "relay.ts", "--fee", "50000000", "--network", "devnet", "--address", "9S8aH8LXtDbPGS5z9dnJWSmwAAjx1AFpQsjBhi8eidnc" ]

