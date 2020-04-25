# Bachelor Thesis

_TODO: write a proper README_

## Requirements

- Docker
- Docker Compose

## Initial setup

- `git clone https://github.com/malfynnction/bachelor-thesis.git && cd bachelor-thesis`
- `npm install`
- `cp website/couchdb/example.couchdb.ini website/production/couchdb.ini`
- Edit `website/production/couchdb.ini`: replace "USERNAME" and "PASSWORD" with admin credentials of your choice
- Change "https://text-stat.qu.tu-berlin.de" in `website/frontend/Dockerfile` to your url
- `python3 -m venv ./venv && source venv/bin/activate && pip install -r requirements.txt`
- [Populate database](#database)

## Local development

- `git pull`
- `npm install`
- `docker-compose -f website/docker-compose-dev.yml up`
- go to [http://localhost:8000](http://localhost:8000)
- happy editing!

## Testing

_TODO_

## Deploys

_TODO_

<a name='database'></a>

## Database

[CouchDB](https://couchdb.apache.org/) is used for the databases for this project. There are five databases:

- participants: All the demographic data on the participants will be stored here
- ratings: The answers the participants gave in the study will be stored here
- items: This is the main database for all the texts you want to have rated
- sessions: The texts will be grouped into "sessions" and will always appear grouped together according to the sessions stored in this database.
  - It is recommended to add a training session, so that participants can get familiar with the website before submitting actual ratings. For a training session, you need to _TODO_. If no training session is declared in your database, a random session will be selected when a user requests to do a training session.
- feedback: all feedback from the participants will be saved here

The `item` and `session` docs can be generated automatically by providing your texts in _TODO_ format and then running `npm run process-texts`. This will create two files in `website/processed-texts`. You then need to upload this folder to your server (e.g. via `scp website/processed-texts/* TODO:processed-texts/`) and add them to your DB by running `public/bin/upload-texts.sh` on your server.

After the study, the ratings, the submitted feedback, and the participant demographics can be downloaded by requesting /api/results, the results will then be returned in _TODO_ format.
