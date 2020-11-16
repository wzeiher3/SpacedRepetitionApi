const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonParser = express.json();

const languageRouter = express.Router()

languageRouter
  .use(requireAuth)
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
      )

      if (!language)
        return res.status(404).json({
          error: `You don't have any languages`,
        })

      req.language = language
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      )

      res.json({
        language: req.language,
        words,
      })
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/head', async (req, res, next) => {
    const language = await LanguageService.getUsersLanguage(req.app.get('db'), req.user.id);
    const head = await LanguageService.getFirstWord(req.app.get('db'), language.id);
    req.language.total_score
    res.status(200).json({
      nextWord: head.original,
      totalScore: req.language.total_score,
      wordCorrectCount: head.correct_count,
      wordIncorrectCount: head.incorrect_count
    });
  })

languageRouter
  .post('/guess', jsonParser, async (req, res, next) => {
    let { guess } = req.body;
    let totalScore = req.language.total_score;
    const language = await LanguageService.getUsersLanguage(req.app.get('db'), req.user.id);
    const head = await LanguageService.getFirstWord(req.app.get('db'), language.id);
    let newHead = await LanguageService.getWord(req.app.get('db'), head.next);
    let correctGuess = false;
    let correctCount = head.correct_count;
    let incorrectCount = head.incorrect_count;
    let currWord = head;
    let nextWord = currWord.next;
    let M = 1;
    let count = 0;
    if (!guess){
      return res.status(400).json({
        error: `Missing 'guess' in request body`,
      })
    }

    if(guess.toLowerCase() === head.translation.toLowerCase()){
      M = head.memory_value * 2;
      correctGuess = true;
      correctCount++;
      totalScore++;
    } else {
      incorrectCount++;
    }

    while(count < M){
      if (nextWord === null){
        count++;
      } else {
        currWord = await LanguageService.getWord(req.app.get('db'), currWord.next);
        nextWord = currWord.next;
        count++;
      }
    }

    let updateCurrWord = {
      next: head.id,
    }
    let updateGuessWord = {
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      memory_value: M,
      next: nextWord,
    };

    await LanguageService.setHead(req.app.get('db'), head.language_id, head.next)
    await LanguageService.setWord(req.app.get('db'), currWord.id, updateCurrWord);
    await LanguageService.setWord(req.app.get('db'), head.id, updateGuessWord);
    await LanguageService.setTotalScore(req.app.get('db'), head.language_id, totalScore);

    let result = {
      nextWord: newHead.original,
      totalScore: totalScore,
      wordCorrectCount: newHead.correct_count,
      wordIncorrectCount: newHead.incorrect_count,
      answer: head.translation,
      isCorrect: correctGuess
    }
    res.json(result)
  })

module.exports = languageRouter
