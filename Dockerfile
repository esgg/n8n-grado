# Stage 1: get apk + libs from a normal Alpine image
FROM alpine:3.22 AS alpine

# Stage 2: your n8n base image
FROM n8nio/n8n:latest

USER root

# Copy apk binary + required libraries into the n8n image
COPY --from=alpine /sbin/apk /sbin/apk
COPY --from=alpine /lib/ld-musl-*.so.1 /lib/
COPY --from=alpine /usr/lib/libapk.so* /usr/lib/

# Now apk works again
RUN apk add --no-cache docker-cli

RUN apk add --no-cache python3 py3-pip py3-virtualenv

RUN addgroup -g 116 docker && addgroup node docker