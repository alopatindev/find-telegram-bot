FROM node:6.9.5
ENV PHANTOMJS_VERSION 2.1.1

# install phantomjs
WORKDIR /tmp
ENV PHANTOMJS_DIR phantomjs-$PHANTOMJS_VERSION-linux-x86_64
ENV PHANTOMJS_ARCHIVE $PHANTOMJS_DIR.tar.bz2
RUN curl -sLO https://bitbucket.org/ariya/phantomjs/downloads/$PHANTOMJS_ARCHIVE
RUN tar xjf $PHANTOMJS_ARCHIVE
RUN install -t /usr/local/bin $PHANTOMJS_DIR/bin/phantomjs

# install app
RUN mkdir -p /app
COPY . /app
WORKDIR /app
RUN npm install --production

# mount logs
VOLUME logs
RUN chown node:node logs

# run app
USER node
CMD ["node", "./app.js"]
