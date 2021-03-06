import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './styles/TakeQuiz.scss';
import { questionTypes, getKey, initializeState } from '../helpers';
import socket from '../socket';

export default class TakeQuiz extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: `${props.username}_${getKey()}`,
      currentQuestion: 0,
      answers: initializeState(props.quiz),
    };
    this.handleClick = this.handleClick.bind(this);
    this.determineInputType = this.determineInputType.bind(this);
    this.handleSelectAnswer = this.handleSelectAnswer.bind(this);
  }

  handleClick(event) {
    const { textContent } = event.target;
    const { questions } = this.props.quiz;
    const { currentQuestion } = this.state;

    if (textContent === 'Next' && currentQuestion < questions.length - 1) {
      const newState = this.state.currentQuestion + 1;
      this.setState({ currentQuestion: newState });
    } else if (textContent === 'Prev' && currentQuestion > 0) {
      const newState = this.state.currentQuestion - 1;
      this.setState({ currentQuestion: newState });
    }
  }

  handleSelectAnswer(event) {
    const { answers, currentQuestion } = this.state;

    const selectedAnswersArray = answers[currentQuestion].selectedAnswers;
    const selectedElement = event.target.dataset.id;
    const newState = [...answers];

    if (selectedAnswersArray.find(thisAnswer => selectedElement === thisAnswer)) {
      const newAnswers = selectedAnswersArray.filter(answer => selectedElement !== answer);
      newState[currentQuestion].selectedAnswers = newAnswers;

      this.setState({ answers: newState });
    } else if (event.target.type === 'checkbox') {
      newState[currentQuestion] = { selectedAnswers: [...selectedAnswersArray, selectedElement] };
      this.setState({ answers: newState });
    } else if (event.target.type === 'radio') {
      newState[currentQuestion] = { selectedAnswers: [selectedElement] };
      this.setState({ answers: newState });
    }

    const sendData = {
      name: this.state.name,
      answer: newState[this.state.currentQuestion].selectedAnswers[0],
      questionId: this.props.quiz.questions[this.state.currentQuestion].id,
      room: this.props.code,
    };

    socket.emit('selectAnswer', sendData);
  }

  determineInputType(answer, index) {
    const { quiz } = this.props;
    const { currentQuestion, answers } = this.state;

    switch (quiz.questions[currentQuestion].question_type) {
      case 'multiple choice-multiple answer':
        return (
          <div
            key={`answer_${answer.id}`}
            className="take-quiz-anzswers"
          >
            <input
              type="checkbox"
              data-id={answer.id}
              name={index}
              value={answer.answer_text}
              onClick={this.handleSelectAnswer}
              checked={answers[currentQuestion].selectedAnswers.includes(answer.id.toString())}
            />
            <label htmlFor={`answer_id_${answer.id}`}>{answer.answer_text}</label>
          </div>
        );
      default:
        return (
          <div
            key={answer.answer_text}
            className="take-quiz-answers"
          >
            <input
              type="radio"
              data-id={answer.id}
              name={index}
              value={answer.answer_text}
              onChange={this.handleSelectAnswer}
              checked={answers[currentQuestion].selectedAnswers.includes(answer.id.toString())}
            />
            <label htmlFor={`answer_id_${answer.id}`}>{answer.answer_text}</label>
          </div>
        );
    }
  }

  render() {
    const { quiz } = this.props;
    const { currentQuestion } = this.state;
    const final = this.state.answers.length - 1;

    const nextBnt = final !== currentQuestion ? <button className="take-quiz-btn" onClick={this.handleClick}>Next</button> : <a href="https://quizzam.herokuapp.com/" className="take-quiz-btn decoration-off" onClick={this.handleClick}>Submit</a>;

    if (!quiz.id) {
      return <h3>LOADING</h3>;
    }

    return (
      <main>
        <header className="take-quiz-header">
          <h1>{quiz.name}</h1>
          <h1>Subject: {quiz.subject}</h1>
          <h1>Room: {quiz.id}</h1>
        </header>
        <section className="take-quiz-question">
          <h3 className="take-quiz-question-title">
            {quiz.questions[currentQuestion].question_text}
          </h3>
          <div className="question-wrapper">
            <p className="take-quiz-question-type">
              ({questionTypes[quiz.questions[currentQuestion].question_type]})
            </p>
            <form className="take-quiz-form">
              {quiz.questions[currentQuestion].answers
                .map((answer, index) => {
                  return this.determineInputType(answer, index);
                })}
            </form>
            <nav className="take-quiz-nav">
              <button
                className="take-quiz-btn"
                onClick={this.handleClick}
              >Prev
              </button>
              {nextBnt}
            </nav>
          </div>
        </section>
      </main>
    );
  }
}

TakeQuiz.propTypes = {
  code: PropTypes.string,
  quiz: PropTypes.object,
  username: PropTypes.string,
};
