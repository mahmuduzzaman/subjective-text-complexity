#! /usr/bin/env bash

# load DB admin password from env
ENV_FILE="/home/adminuser/subjective-text-complexity/website/.env"
export $(cat $ENV_FILE | xargs)

encoded=$(echo "admin:${COUCHDB_PASSWORD}" | base64)
authentication="${encoded:0:$((${#encoded}-1))}="


for database in "items" "sessions" "participants" "ratings" "feedback" ; do
  status_code=$(curl -I --write-out %{http_code} --silent --output /dev/null localhost:5984/${database})

  if [ $status_code -eq 404 ]; then
    # Database does not exist => create it
    curl -X PUT localhost:5984/${database} -H "Authorization: Basic ${authentication}"
  elif [ $status_code -ne 200 ]; then
    # Error
    echo "Database ${database} returned status code ${status_code}, aborting..."
    exit 1
  fi

  CONTENT="${database}.json"
  if [[ -f "$CONTENT" ]]; then
    # upload content to DB
    curl -X POST localhost:5984/${database}/_bulk_docs -H 'Content-Type: application/json' -d @$CONTENT
  fi
done
