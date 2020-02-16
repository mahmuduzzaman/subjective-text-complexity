import React, { Fragment } from 'react'
import { get, shuffle } from 'lodash'
import '../styles/Tasks.css'

const punctuation = /\.|,|-|\(|\)|\/|"|;|:|…/g

class Tasks extends React.Component {
  getSuggestions(original, alternatives) {
    const suggestions = [...alternatives, original]
    return shuffle(suggestions.map(word => word.replace(punctuation, '')))
  }

  deleteWord({ original, wordIndex, alternativeSuggestions }, clozeIndex) {
    return (
      <Fragment>
        <select
          onChange={e => {
            const entered = e.target.value
            const isCorrect = entered === original
            this.props.onChange(clozeIndex, { entered, original, isCorrect })
          }}
          value={get(this.props, ['enteredData', clozeIndex, 'entered'], '')}
          name={`deletion-${wordIndex}`}
          id={`deletion-${wordIndex}`}
        >
          <option value={''} disabled>
            Please Select
          </option>
          {this.getSuggestions(original, alternativeSuggestions).map(
            (word, i) => {
              return (
                <option
                  value={word}
                  key={`deletion-${wordIndex}-suggestion-${i}`}
                >
                  {word}
                </option>
              )
            }
          )}
        </select>{' '}
      </Fragment>
    )
  }

  render() {
    const { text, clozes, type, enclosingParagraph } = this.props.item
    const words = text.split(' ')
    clozes.forEach((cloze, i) => {
      words[cloze.wordIndex] = this.deleteWord(cloze, i)
    })
    const isSentence = type === 'sentence'
    const splitText = isSentence && enclosingParagraph.split(text)

    return (
      <Fragment>
        <div>
          Please fill in the gaps:
          {isSentence ? (
            <Fragment>
              <br /> (The enclosing paragraph is shown for more context
              information)
            </Fragment>
          ) : null}
        </div>
        <p id="cloze">
          {isSentence ? splitText[0] : null}
          {words.map((word, i) => {
            return (
              <span
                key={`word-${i}`}
                className={isSentence ? 'actual-sentence' : null}
              >
                {word}{' '}
              </span>
            )
          })}
          {isSentence ? splitText[1] : null})
        </p>
      </Fragment>
    )
  }
}

export default Tasks
