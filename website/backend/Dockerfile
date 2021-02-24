FROM node:12.16-alpine3.9 as builder
WORKDIR /app

#ARG STUDY_IS_OPEN
#ENV STUDY_IS_OPEN=$STUDY_IS_OPEN

# copy package.json first to avoid unnecessary npm install
COPY package*.json ./ 
RUN npm install

RUN apk add --no-cache bash coreutils grep sed
COPY . .
EXPOSE 8080

CMD ["node", "/app/server.js" ]
