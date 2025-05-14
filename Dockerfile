# syntax=docker/dockerfile:experimental
# BUILD IMAGE
FROM node:24-bullseye as build

RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  g++ \
  libomniorb4-dev

WORKDIR /opt/quantel-gateway
COPY . .
RUN yarn install --check-files --frozen-lockfile
RUN yarn build
RUN yarn install --check-files --frozen-lockfile --production --force # purge dev-dependencies

# DEPLOY IMAGE
FROM node:24-bullseye-slim as prod

RUN apt-get update && apt-get install -y \
  libomniorb4-2 \
  curl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS="--report-uncaught-exception --report-on-fatalerror --report-on-signal --report-signal=SIGUSR2 --report-directory=./tmp"

COPY --from=build /opt/quantel-gateway /opt/quantel-gateway
WORKDIR /opt/quantel-gateway

EXPOSE 3000
CMD ["yarn", "start"]
