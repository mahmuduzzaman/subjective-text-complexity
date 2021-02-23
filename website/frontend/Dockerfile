FROM node:12.16-alpine3.9 as builder
WORKDIR /app

#ARG STUDY_IS_OPEN
#ENV STUDY_IS_OPEN True

ARG STUDY_IS_OPEN
ENV REACT_APP_STUDY_IS_OPEN=$STUDY_IS_OPEN

# copy package.json first to avoid unnecessary npm install
COPY package.json /app 
RUN npm install

RUN apk add --no-cache bash coreutils grep sed

COPY src /app/src
COPY public /app/public

RUN npm run build

FROM nginx:1.17.9-alpine 
COPY --from=builder /app/build /var/www/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
