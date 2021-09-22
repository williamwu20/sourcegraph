#!/usr/bin/env bash

if [[ ! -f build.log ]]; then
  echo "No build.log found - run ./build.sh first."
  exit 1
fi

GOOGLE_IMAGE=$(cat build.log | grep 'gcp: A disk image was created:' | head | sed -n 's/(executor-.+)/\1/p')
AWS_IMAGE=$(cat build.log | grep 'AMIs were created:' | head | sed -n 's/(ami-.+)/\1/p')

echo "GOOGLE_IMAGE=${GOOGLE_IMAGE}"
echo "AWS_IMAGE=${AWS_IMAGE}"

# Add released label to the image built by the build.sh command
gcloud compute images add-labels --project=sourcegraph-ci "${GOOGLE_IMAGE}" --labels='released=true'
