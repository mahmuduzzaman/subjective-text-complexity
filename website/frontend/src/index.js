import React, { Fragment, useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import './styles/bootstrap/bootstrap.css'
import './styles/index.css'
import * as serviceWorker from './serviceWorker'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from 'react-router-dom'
import Instructions from './components/Instructions'
import Session from './components/Session'
import Start from './components/Start'
import Demographics from './components/Demographics'
import StartSession from './components/StartSession'
import createStore from './lib/create-store'
import createDatabase from './lib/create-database'
import getFromUrlParams from './lib/get-from-url-params'
import Feedback from './components/Feedback'
import Privacy from './components/Privacy'
import Logout from './components/Logout'
import ListeningExercise from './components/ListeningExercise'
import Impressum from './components/Impressum'
import StudyIsFinished from './components/StudyIsFinished'
import { CONTACT_MAIL } from './config.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

const participantId = createStore('participantId')
const demographicStore = createStore('demographic', {
  deleteAfterSession: true,
})
const trainingStore = createStore('trainingState')
const seedStore = createStore('seed')

const pouchParticipants = createDatabase('participants')
const pouchRatings = createDatabase('ratings')
const pouchSessions = createDatabase('sessions')
const pouchItems = createDatabase('items')

const emptyParticipant = { completedSessions: [] }

//const studyIsOpen = process.env.REACT_APP_STUDY_IS_OPEN === 'true'
const studyIsOpen = true

const App = () => {
  console.log("Start APP :"+ studyIsOpen)
  const id = participantId.get()
  const [isLoggedIn, setLoggedIn] = useState(Boolean(id))
  const [trainingState, setTrainingState] = useState(trainingStore.get())
  const [participant, setParticipant] = useState({ ...emptyParticipant })

  const topRef = useRef(null)

  const sessionCount = Object.keys(participant.completedSessions).length

  useEffect(() => {
    pouchParticipants
      .get(id)
      .then(participant => {
        setParticipant(participant)
        const { completedTrainingSession } = participant
        const trainingStateFromDb = completedTrainingSession
          ? 'completed'
          : 'not started'
        setTrainingState(trainingStateFromDb)
        trainingStore.set(trainingStateFromDb)
      })
      .catch(err => {
        // nonexistent participant is expected when not logged in
        if (id || err.status !== 404) {
          console.error(err)
        }
      })
  }, [id])

  const scrollToTop = () => {
    topRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  const onLogOut = () => {
    localStorage.clear()
    sessionStorage.clear()
    setLoggedIn(false)
    setParticipant({ ...emptyParticipant })
  }

  const renderHeader = () => {
    return (
      <Fragment>
        <header ref={topRef}>
          <Link to="/">
            <img
              src="logo.png"
              id="header-img"
              alt="Logo of the Technische Universität Berlin"
            />
          </Link>
          <div id="participant-id">
            {isLoggedIn ? (
              <Fragment>
                <span id="participant-id-label">Participant ID: {id}</span>
                <Link to="/logout" onClick={onLogOut}>
                  Log out
                </Link>
              </Fragment>
            ) : null}
          </div>
        </header>
        {sessionCount ? (
          <div className="survey-count">
            Completed surveys: {sessionCount}{' '}
            {sessionCount >= 30 ? (
              <span className="tu-red">
                <br />
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <strong>
                  You can only receive compensation for up to 30 surveys.
                </strong>
              </span>
            ) : null}
          </div>
        ) : null}
      </Fragment>
    )
  }

  const renderFooter = () => {
    return (
      <footer>
        <Link to="/privacy">Data Protection</Link>
        <div className="vertical-separator" />
        <a href={`mailto:${CONTACT_MAIL}`} target="blank">
          Contact
        </a>
        <div className="vertical-separator" />
        <Link to="/impressum">Impressum</Link>
      </footer>
    )
  }

  if (!studyIsOpen) {
    {
      /* early return because study is finished */
    }
    return (
      <Router>
        <Route path="/">
          {renderHeader()}
          <div className="layout centered-content">
            <StudyIsFinished />
          </div>
          {renderFooter()}
        </Route>
      </Router>
    )
  }

  return (
    <Router>
      {/* Wrap everything in an additional "fake" Route to have access to location props*/}
      <Route
        render={props => {
          const idFromParams = getFromUrlParams('participant-id', props)
          if (idFromParams) {
            participantId.set(idFromParams)
            setLoggedIn(true)
          }

          const seed = getFromUrlParams('seed', props)
          if (seed) {
            seedStore.set(seed)
          }
          return (
            <Fragment>
              {renderHeader()}
              <div
                className={`layout centered-content ${
                  sessionCount >= 30 ? 'extra-header-space' : ''
                }`}
              >
                <Switch>
                  <Route path="/logout">
                    <Logout isLoggedIn={isLoggedIn} onLogOut={onLogOut} />
                  </Route>
                  <Route path="/listening-exercise">
                    <ListeningExercise
                      consent={getFromUrlParams('consent', props)}
                      createUser={async audioAnswers => {
                        const data = demographicStore.get() || {}
                        data.listeningExercise = audioAnswers
                        if (data.gender === 'text') {
                          data.gender = data.genderText
                        }
                        delete data.genderText

                        const loggedInId = participantId.get()
                        if (loggedInId) {
                          try {
                            await pouchParticipants.get(loggedInId)
                            return
                          } catch (e) {
                            // this error is expected: id does not exist => create a new participant
                          }
                        }
                        pouchParticipants.getAll().then(async docs => {
                          const usedIds = docs.map(participant =>
                            parseInt(participant._id)
                          )

                          let lowestUnused = 1
                          while (usedIds.includes(lowestUnused)) {
                            lowestUnused++
                          }
                          const newId = loggedInId || lowestUnused
                          await pouchParticipants.put({
                            ...data,
                            _id: newId.toString(),
                            completedSessions: {},
                          })

                          participantId.set(newId)
                          setLoggedIn(true)
                        })
                      }}
                    />
                  </Route>
                  <Route path="/instructions">
                    <Instructions
                      pouchParticipants={pouchParticipants}
                      login={id => {
                        participantId.set(id)
                        setLoggedIn(true)
                      }}
                    />
                  </Route>
                  <Route path="/demographics">
                    <Demographics />
                  </Route>
                  <Route path="/start-session">
                    <StartSession
                      {...props}
                      onStartTraining={() => {
                        trainingStore.set('in progress')
                        setTrainingState('in progress')
                      }}
                      pouchParticipants={pouchParticipants}
                    />
                  </Route>
                  <Route path="/session">
                    {isLoggedIn ? (
                      trainingState === 'not started' ? (
                        <Redirect to="/start-session" />
                      ) : (
                        <Session
                          pouchRatings={pouchRatings}
                          pouchParticipants={pouchParticipants}
                          pouchSessions={pouchSessions}
                          pouchItems={pouchItems}
                          isTraining={trainingState === 'in progress'}
                          onEndTraining={() => {
                            trainingStore.set('completed')
                            setTrainingState('completed')
                          }}
                          onScrollToTop={() => scrollToTop()}
                        />
                      )
                    ) : (
                      <Redirect to="/" />
                    )}
                  </Route>
                  <Route path="/feedback">
                    {participantId.get() ? (
                      <Feedback participantId={participantId.get()} />
                    ) : (
                      <Redirect to="/start" />
                    )}
                  </Route>
                  <Route path="/privacy">
                    <Privacy prev={getFromUrlParams('prev', props)} />
                  </Route>
                  <Route path="/impressum">
                    <Impressum />
                  </Route>
                  <Route path="/">
                    <Start />
                  </Route>
                </Switch>
              </div>
              {renderFooter()}
            </Fragment>
          )
        }}
      ></Route>
    </Router>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
