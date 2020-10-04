FROM node:10-alpine
RUN mkdir -p ng-covid19/node_modules && chmod 775 -R ng-covid19/node_modules
WORKDIR ng-covid19
COPY * ./
EXPOSE 3000
CMD node app.js