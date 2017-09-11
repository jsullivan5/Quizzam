// import genRoomNumber from '../src/helpers';

const { db } = require('../server');
const { genRoomNumber } = require('../src/helpers');

exports.quiz = (req, res) => {
  db('room').join('quiz', 'room.quiz_id', '=', 'quiz.id')
    .select('name', 'subject', 'type', 'room.id', 'quiz_id')
    .where('room.id', req.params.id)
    .then((currentQuiz) => {
      return db('question').where('quiz_id', currentQuiz[0].quiz_id).select()
        .then((questions) => {
          currentQuiz[0].questions = questions;
          return currentQuiz;
        })
        .then((quizWithQuestions) => {
          return Promise.all(quizWithQuestions[0].questions.map((question, questIndex, questArray) => {
            return db('answer').where('question_id', question.id).select()
              .then((answers) => {
                questArray[questIndex].answers = answers;
                return questArray[questIndex];
              });
          }))
            .then(() => quizWithQuestions);
        });
    })
    .then(data => res.status(200).json(data[0]));
};

exports.addRoom = (req, res) => {
  const roomId = genRoomNumber();
  const quizId = req.params.quiz_id;
  const newRoom = Object.assign({}, { id: roomId }, { quiz_id: parseInt(quizId, 10) });

  return db('room')
    .insert(newRoom, 'id')
    .then(roomCode => res.status(201).json({
      id: roomCode[0],
    }))
    .catch(error => res.status(500).json({
      error,
    }));
};
