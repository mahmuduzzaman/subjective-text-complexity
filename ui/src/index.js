import React, { Fragment, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import './bootstrap/bootstrap.css'
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
import newPouchDB from './lib/new-pouch-db'

const participantId = createStore('participantId')
const trainingStore = createStore('trainingState')

const pouchParticipants = newPouchDB('participants')
const pouchRatings = newPouchDB('ratings')
const pouchSessions = newPouchDB('sessions')
const pouchItems = newPouchDB('items')

const getIdFromParams = ({ location }) => {
  const params = location.search.slice(1).split('&')
  const idParam = params.find(param => param.startsWith('participant-id'))
  return idParam && idParam.split('=')[1]
}

const App = () => {
  const id = participantId.get()
  const [showId, setShowId] = useState(Boolean(id))
  const [trainingState, setTrainingState] = useState(trainingStore.get())

  const topRef = useRef(null)

  if (!trainingState) {
    pouchParticipants.get(id).then(participant => {
      const { completedTrainingSession } = participant
      const trainingStateFromDb = completedTrainingSession
        ? 'completed'
        : 'not started'
      setTrainingState(trainingStateFromDb)
      trainingStore.set(trainingStateFromDb)
    })
  }

  const scrollToTop = () => {
    topRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Router>
      {/* Wrap everything in an additional "fake" Route to have access to location props*/}
      <Route
        render={props => {
          const idFromParams = getIdFromParams(props)
          if (idFromParams) {
            participantId.set(idFromParams)
            setShowId(true)
          }
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
                  {showId ? (
                    <Fragment>
                      <span id="participant-id-label">
                        Participant ID: {id}
                      </span>
                      <Link
                        to="/"
                        onClick={() => {
                          sessionStorage.clear()
                          setShowId(false)
                        }}
                      >
                        Log out
                      </Link>
                    </Fragment>
                  ) : null}
                </div>
              </header>
              <div className="layout centered-content">
                <Switch>
                  <Route path="/instructions">
                    <Instructions pouchParticipants={pouchParticipants} />{' '}
                  </Route>

                  <Route path="/demographics">
                    <Demographics
                      createUser={async data => {
                        pouchParticipants.allDocs().then(async docs => {
                          const usedIds = docs.rows.map(
                            participant => participant.id
                          )
                          const newId = Math.max(...usedIds, 0) + 1
                          participantId.set(newId)
                          setShowId(true)
                          await pouchParticipants.put({
                            ...data,
                            _id: newId.toString(),
                            completedSessions: [],
                          })
                        })
                      }}
                    />
                  </Route>
                  <Route path="/start-session">
                    <StartSession
                      onStartTraining={() => {
                        trainingStore.set('in progress')
                        setTrainingState('in progress')
                      }}
                      pouchParticipants={pouchParticipants}
                    />
                  </Route>
                  <Route path="/session">
                    {showId ? (
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
                  <Route path="/">
                    <Start />
                  </Route>
                </Switch>
              </div>
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
