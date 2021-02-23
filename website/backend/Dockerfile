FROM node:12.16-alpine3.9 as builder
WORKDIR /app

# ENV STUDY_IS_OPEN True

# copy package.json first to avoid unnecessary npm install
COPY package*.json ./ 
RUN npm install

RUN apk add --no-cache bash coreutils grep sed
COPY . .
EXPOSE 8080

CMD ["node", "/app/server.js" ]
