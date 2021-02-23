# subjective-text-complexity

**Note:** Most of the functionality of the website, as well as automatic deployment, is currently disabled since the study is finished. To bring it back to working mode, change the variable `STUDY_IS_OPEN` in `.github/workflows/deploy.yml` and `website/.env` to `"true"`.

## Requirements

- Docker
- Docker Compose

### Additional Development Requirements

- Node.js (version 12.13)
- python

## Initial setup

- Fork the repository & clone it to your computer
- `npm install`
- `pip install -r requirements.txt && python -m spacy download de_core_news_sm`
- Adjust the config in `website/frontend/src/config.js` and `config.yml`
- Add necessary [GitHub Secrets](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets#creating-encrypted-secrets-for-a-repository) to your repository for automatic deployment:
  - `CONTACT_MAIL`: Mail address for participants to contact you
  - `COUCHDB_PASSWORD`: Admin password for your CouchDB
  - `DOCKER_USERNAME` and `DOCKER_PASSWORD`: Your dockerhub credentials
  - `PRIVATE_SSH_KEY`: A private SSH key that can be used to access your server & run scripts via SSH
- [Populate database](#preprocessing)

## Local development

- `git pull`
- `npm install`
- `cd website && docker-compose up`
- go to [http://localhost:8000](http://localhost:8000)

## Testing

Unit tests can be run locally with `npm test`. They are also run automatically on every push to the repository.

## Deploys

The website is deployed automatically via github actions on every push to the `main` branch which is tagged as `release*`.
~~The Docker Images for the frontend and backend are published on [dockerhub](https://hub.docker.com/u/malfynnction) and then started on the server via docker-compose (See `production` directory)~~
Docker images are build locally. 

## Database

[CouchDB](https://couchdb.apache.org/) is used for the databases for this project. There are five databases:

<details>
  <summary>participants</summary>
  All the demographic data on the participants will be stored here:
  
  | FIELD NAME | TYPE | DESCRIPTION |
  |--------------------------|------------------|-------------------------------------------------------------------------------|
  | \_id | String | |
  | age | String | One of “18-26”, “27-32”, “33-40”, “41-55”, “56+”, and “Prefer not to say” |
  | nativeLang | String | The native language(s) of the participant |
  | gender | String | The gender(s) of the participant |
  | gerLevel | String | The participant's language proficiency<br>according to the CEFR |
  | completedSessions | Array of Strings | The \_id values of the sessions the participant<br>has already rated |
  | completedTrainingSession | Boolean | Indicates whether the participant has<br>already completed a training session |
  | listeningExercise | Object: | |
  | ↳ score | Number | Overall score for the listening exercises |
  | ↳ answers | Object | Individual checked answers for each question |
</details>

<details>
  <summary>ratings</summary>
  The answers the participants gave in the study will be stored here:
  
  | FIELD NAME | TYPE | DESCRIPTION |
  |------------------------|-------------------|-----------------------------------------------------------------------------------------------------|
  | \_id | String | |
  | itemId | String | The \_id of the item that was rated |
  | participantId | String | The \_id of the participant who submitted the rating |
  | readingTime | Number | The amount of time (in ms) it took the participant<br>to read the paragraph<br>(is 0 for sentences) |
  | questions | Object: | |
  | ↳ understandability | Number | 1 (easiest) - 7 (hardest) |
  | ↳ complexity | Number | 1 (easiest) - 7 (hardest) |
  | ↳ readability | Number | 1 (easiest) - 7 (hardest) |
  | ↳ hardestSentence | Number | Index of the hardest sentence in the paragraph |
  | ↳ paragraphNecessary | Number | 1 (not necessary) - 7 (completely necessary) |
  | questions | Array of Objects: | |
  | ↳ original | String | The original word that was deleted |
  | ↳ entered | String | The word that the participant chose |
  | ↳ isCorrect | Boolean | Indicates whether the answer was correct |
</details>

<details>
  <summary>items</summary>
  This is the main database for all the texts you want to have rated:
  
  | FIELD NAME | TYPE | DESCRIPTION |
  |--------------------------|-------------------|-----------------------------------------------------------------------------------------------------------|
  | \_id | String | |
  | type | String | Either "sentence" or "paragraph" |
  | text | String | The text that will be rated |
  | clozes | Array of Objects: | The words that should be deleted for the cloze test: |
  | ↳ wordIndex | Number | The index of the word within the text |
  | ↳ original | String | The word that should be deleted |
  | ↳ alternativeSuggestions | Array of Strings | Alternative answers in the Multiple Choice test |
  | sentences | Array of Strings | (only for paragraphs) The individual sentences of the paragraph, separated by Natural Language Processing |
  | enclosingParagraph | String | (only for sentences) The complete paragraph that the sentence was taken from |
</details>
  
<details>
  <summary>sessions</summary>
  The texts will be grouped into "sessions" and will always appear grouped together according to the sessions stored in this database:
  
  | FIELD NAME | TYPE | DESCRIPTION |
  |------------|------------------|--------------------------------------------|
  | \_id | String | |
  | items | Array of Strings | The \_id values of the items in the session |
  
  It is recommended to add a training session, so that participants can get familiar with the website before submitting actual ratings. For a training session, you can add a session with the ID "Training" to your DB. If no training session is declared in your database, a random session will be selected when a user requests to do a training session.
</details>
  
<details>
  <summary>feedback</summary>
  All feedback from the participants will be saved here:

| FIELD NAME                     | TYPE    | DESCRIPTION                                            |
| ------------------------------ | ------- | ------------------------------------------------------ |
| \_id                           | String  |                                                        |
| participantId                  | String  | The \_id of the participant who submitted the feedback |
| hadTechnicalProblems           | Boolean |                                                        |
| technicalProblemsDetails       | String  |                                                        |
| didUnderstandInstructions      | Number  | 1 ("Always") - 7 ("Never")                             |
| unclearInstructions            | String  | Details on which instructions were unclear and why     |
| unableToAnswerCorrectly        | Boolean |                                                        |
| unableToAnswerCorrectlyDetails | String  |                                                        |
| notes                          | String  | Anything else the user wanted to say                   |

</details>

The database is backed up automatically once a day via a cron job. The backups are stored on the server in `db-backups/`.

<a name='preprocessing'></a>

## Pre- & Postprocessing

The texts can be generated automatically by providing IDs and texts in an excel file (see `config.yml` for configuration of file path and sheet & column names).
You can then run `python website/process_texts.py`, which will create two files in `data/texts/`. You then need to upload this folder to your server (e.g. via `scp data/texts/* [YOUR_SERVER_HERE]:texts/`) and add them to your DB by running `production/bin/upload-texts.sh` on your server.

After the study, the results can be downloaded into the `data/results/` directory by running `cd data && node download-raw-results.js`. You can summarize the results and do some analysis by running `cd data && node index.js`, but since that depends heavily on your use case and goals of your study, you will probably have to change a lot of the code.

## Participant Sessions

If you plan on doing in-person sessions, you should make sure nothing is saved to the localStorage, to avoid data being exposed to participants sharing the same computer. This can be done by changing https://github.com/malfynnction/bachelor-thesis/blob/a75ed2ec0f8be9c2308a1aabd95cec1901236e44/website/frontend/src/lib/create-store.js#L2 to `const store = sessionStorage`.

For every submitted survey, a confirmation token is generated and given to the participants. They will use this token to prove that they completed the survey. You can check the validity of given tokens by inserting the participant ID and token in `data/check-legitimacy.js` and running that script with `cd data && node check-legitimacy.js`. This will not only check whether the tokens are valid, but also download all ratings that the participant has submitted, so you can check if their answers seem legitimate.
If you identify a participant as a scammer, you can paste their ID into `website/frontend/src/scamming-ids.json` so that it will be ignored for all further calculations and analysis.

## License

Contact: Babak Naderi
## License

MIT License

Copyright 2020 (c) Fynn Heintz.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
