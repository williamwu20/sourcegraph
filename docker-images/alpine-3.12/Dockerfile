# This Dockerfile defines the sourcegraph/alpine Docker image, which is the
# base image used by all Sourcegraph Docker images.

FROM alpine:3.12@sha256:a721d672be3cdaaf1285c2b60b76d81ab4a8a3cf5a7180a966f2c545305ad6de

LABEL org.opencontainers.image.url=https://sourcegraph.com/
LABEL org.opencontainers.image.source=https://github.com/sourcegraph/sourcegraph/
LABEL org.opencontainers.image.documentation=https://docs.sourcegraph.com/

# Add the sourcegraph group, user, and create the home directory.
#
# We use a static GID/UID assignment to ensure files can be chown'd to this
# user on the host machine (where this user does not exist).
# See https://github.com/sourcegraph/sourcegraph/issues/1884
RUN addgroup -g 101 -S sourcegraph && adduser -u 100 -S -G sourcegraph -h /home/sourcegraph sourcegraph

# Install bind-tools to ensure working DNS on user-defined Docker networks.
#
# IMPORTANT: Alpine by default does not come with some packages that are needed
# for working DNS to other containers on a user-defined Docker network. Without
# installing this package, nslookup, Go binaries, etc. will fail to contact
# other Docker containers.
# See https://github.com/sourcegraph/deploy-sourcegraph-docker/issues/1
# Install other packages that are desirable in ALL Sourcegraph Docker images.
# hadolint ignore=DL3018
RUN apk add --no-cache bind-tools ca-certificates curl mailcap tini
