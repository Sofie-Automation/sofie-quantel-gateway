# syntax=docker/dockerfile:experimental
# BUILD IMAGE
FROM node:25 as build

RUN apt-get update && apt-get install -y \
  build-essential \
  g++ \
  libomniorb4-dev

WORKDIR /opt/quantel-gateway
COPY . .
RUN yarn install --check-files --frozen-lockfile
RUN yarn build
RUN yarn install --check-files --frozen-lockfile --production --force # purge dev-dependencies

# DEPLOY IMAGE
FROM node:25-slim

RUN apt-get update && apt-get install -y \
  libomniorb4-2 curl dumb-init \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/quantel-gateway /opt/quantel-gateway


# Run as non-root user
USER 1000
WORKDIR /opt/quantel-gateway
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["yarn", "start"]
