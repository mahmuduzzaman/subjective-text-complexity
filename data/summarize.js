const fs = require('fs')

const spacesInBeginningAndEnd = /^[ \s]+|[ \s]+$/g

const items = JSON.parse(fs.readFileSync('texts/items.json'))
const participants = JSON.parse(
  fs.readFileSync('results/usable-participants.json')
)
const ratings = JSON.parse(fs.readFileSync('results/usable-ratings.json'))

const understoodListeningInstructions = participant => {
  return Object.values(participant.listeningExercise.answers).some(
    answers => answers.length != 1
  )
}

const sum = array => array.reduce((sum, curr) => sum + curr, 0)
const average = array => sum(array) / array.length

const summarizeDemographic = () => {
  const keys = ['age', 'gender', 'nativeLang', 'gerLevel']
  const summary = participants.reduce((result, participant) => {
    keys.forEach(key => {
      if (!participant[key]) {
        return
      }
      if (!result[key]) {
        result[key] = {}
      }
      const values = participant[key]
        .split(',')
        .map(e => e.replace(spacesInBeginningAndEnd, ''))
      values.forEach(value => {
        const prevResult = result[key][value] || 0
        result[key][value] = prevResult + 1
      })
    })
    return result
  }, {})

  summary.totalParticipants = participants.length

  const participantsWhoUnderstoodListeningInstructions = participants.filter(
    p => understoodListeningInstructions(p)
  )
  summary.listeningExercise = {
    probablyDidntUnderstandInstructions:
      participants.length -
      participantsWhoUnderstoodListeningInstructions.length,
    overallAverage:
      participants.reduce((sum, p) => sum + p.listeningExercise.score, 0) /
      participants.length,
    averageIfUnderstoodInstructions:
      participantsWhoUnderstoodListeningInstructions.reduce(
        (sum, p) => sum + p.listeningExercise.score,
        0
      ) / participantsWhoUnderstoodListeningInstructions.length,
  }

  fs.writeFileSync('results/summary/demographics.json', JSON.stringify(summary))
}

const getGroupedRatings = () => {
  const ratingsPerItem = items.docs.reduce((acc, item) => {
    const accordingRatings = ratings.filter(
      rating => rating.itemId === item._id
    )
    return { ...acc, [item._id]: accordingRatings }
  }, {})
  delete ratingsPerItem.Training_simple
  delete ratingsPerItem.Training_average
  delete ratingsPerItem.Training_hard
  return ratingsPerItem
}

const summarizeRatings = () => {
  const groupedRatings = getGroupedRatings()
  const questions = ['readability', 'understandability', 'complexity']

  const result = Object.keys(groupedRatings).reduce((summary, id) => {
    const itemRatings = groupedRatings[id]
    const clozes = itemRatings.flatMap(rating =>
      rating.cloze.map(deletion => {
        if (deletion.isCorrect) {
          return 'correct'
        } else if (deletion.entered === 'idk') {
          return 'idk'
        } else {
          return 'wrong'
        }
      })
    )

    const itemResult = {
      text: items.docs.find(item => item._id === id).text,
      ratingAmount: itemRatings.length,
      readingTime: average(itemRatings.map(rating => rating.readingTime)),
      percentageCorrectClozes:
        (clozes.filter(answer => answer === 'correct').length / clozes.length) *
        100,
      percentageIncorrectClozes:
        (clozes.filter(answer => answer === 'wrong').length / clozes.length) *
        100,
    }
    questions.forEach(question => {
      itemResult[question] = average(
        itemRatings.map(rating => rating.questions[question])
      )
    })

    summary[id] = itemResult
    return summary
  }, {})

  fs.writeFileSync('results/summary/ratings.json', JSON.stringify(result))
}

const summarizeMeta = () => {
  if (!fs.existsSync('results/summary/ratings.json')) {
    summarizeRatings()
  }
  const summarizedRatings = JSON.parse(
    fs.readFileSync('results/summary/ratings.json')
  )

  const summary = {}

  summary.totalParticipants = participants.length
  summary.totalRatings = sum(
    Object.values(summarizedRatings).map(rating => rating.ratingAmount)
  )
  summary.avgRatingPerItem =
    summary.totalRatings / Object.keys(summarizedRatings).length
  summary.minRatingPerItem = Math.min(
    ...Object.values(summarizedRatings).map(rating => rating.ratingAmount)
  )

  summary.percentageCorrectClozes = average(
    Object.values(summarizedRatings).map(
      rating => rating.percentageCorrectClozes
    )
  )
  fs.writeFileSync('results/summary/meta.json', JSON.stringify(summary))
}

summarizeMeta()
