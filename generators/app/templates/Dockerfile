FROM node:8
ENV TERM=xterm

USER node
WORKDIR /home/node

COPY package.json /home/node

COPY node_modules /home/node/node_modules

COPY index.js config.js /home/node/
COPY lib /home/node/lib

EXPOSE 5000
CMD [ "npm", "start" ]
