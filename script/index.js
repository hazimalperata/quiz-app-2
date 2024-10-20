async function getQuestions() {
    const startButton = document.getElementById('start_button');
    const spinner = document.getElementById('spinner');

    const QUESTION_COUNT = 10;

    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=${(QUESTION_COUNT)}&type=multiple`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        alert(`Failed to fetch questions. Please try again later.`);
        startButton.disabled = false;
        spinner.classList.add('hidden');
    }
}

window.addEventListener("load", () => {
    const secondsPerQuestion = 30;
    const secondsPerRead = -1;
    const choiceOptions = ['a', 'b', 'c', 'd'];
    let currentQuestionIndex = -1;
    let totalScore = 0;
    let currentQuestion;
    let countdownTimer;

    let questions = [];
    const userAnswers = [];

    const startButton = document.getElementById('start_button');
    const choiceButtonElements = choiceOptions.map(item => document.getElementById(`option_${item}`));
    const nextQuestionButtonElement = document.getElementById('next_button');
    const remainingLineElement = document.getElementById('remaining_line');
    const remainingTimeElement = document.getElementById('remaining_time');
    const questionContainer = document.getElementById('question_container');
    const tableContainer = document.getElementById('table_container');
    const answerTable = document.getElementById('answer_table');
    const startContainer = document.getElementById('start_container');
    const spinner = document.getElementById('spinner');
    const restartButton = document.getElementById('restart_button');

    restartButton.onclick = restartQuiz;

    function setQuestions(promise) {
        promise.then(e => {
            if (e.response_code === 0) {
                for (const object of e.results) {
                    questions = [...questions, {
                        question: object.question, answers: shuffleArray(object.incorrect_answers.map(item => ({
                            text: item, isCorrect: false
                        })).concat([{text: object.correct_answer, isCorrect: true}]))
                    }]
                }
                startButton.disabled = false;
                spinner.classList.add('hidden');
                startButton.classList.remove('hidden');
            } else {
                alert('Questions could not be drawn properly, the page is being refreshed');
                location.reload();
            }
        });
    }

    function restartQuiz() {
        currentQuestionIndex = -1;
        userAnswers.length = 0;
        questions = [];

        answerTable.innerHTML = `
        <tr>
            <th>Question</th>
            <th>Your Answer</th>
            <th>Correct Answer</th>
            <th>Status</th>
        </tr>
    `;

        tableContainer.classList.add('hidden');
        restartButton.classList.add('hidden');
        questionContainer.classList.add('hidden');
        startContainer.classList.remove('hidden');
        spinner.classList.remove('hidden');
        startButton.disabled = true;

        setQuestions(getQuestions());
    }


    setQuestions(getQuestions());

    startButton.onclick = startQuiz;
    nextQuestionButtonElement.onclick = applyChoice;

    function saveChoice() {
        const isPassAnswer = choiceButtonElements.every(item => !item.checked)

        if (isPassAnswer) {
            userAnswers.push({
                text: currentQuestion.text,
                isCorrect: null,
                correct: currentQuestion.answers.find(item => item.isCorrect).text
            })
        } else {
            choiceButtonElements.forEach((_, index) => {
                if (userAnswers.length === currentQuestionIndex) {
                    if (choiceButtonElements[index].checked) {
                        userAnswers.push({
                            ...currentQuestion.answers[index],
                            correct: currentQuestion.answers.find(item => item.isCorrect).text
                        });
                    }
                }
            })
        }
    }

    function applyChoice() {
        saveChoice();
        currentQuestion = nextQuestion();
        if (currentQuestion === null) {
            clearInterval(countdownTimer);
            endQuiz();
        }
    }


    function nextQuestion() {
        if (currentQuestionIndex !== questions.length - 1) {
            nextQuestionButtonElement.disabled = true;
            remainingLineElement.classList.remove('remainingLine');
            void remainingLineElement.offsetWidth;
            clearInterval(countdownTimer);
            choiceButtonElements.forEach(item => {
                item.checked = false;
                item.disabled = false;
            })
            currentQuestionIndex += 1;
            setQuestion(questions[currentQuestionIndex]);
            startTimer();

            if (currentQuestionIndex === questions.length - 1) {
                nextQuestionButtonElement.innerText = 'Save and Finish The Quiz';
            }

            return questions[currentQuestionIndex];
        }
        return null
    }

    function endQuiz() {
        questionContainer.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        restartButton.classList.remove('hidden');
        setTable();
    }

    function setTable() {
        userAnswers.map((item, index) => {
            const trElement = document.createElement('tr');
            trElement.innerHTML = `<td>${index + 1}) ${questions[index].question}</td>
        <td>${item.text ? item.text : "Empty"}</td>
        <td>${item.correct}</td>
        <td><div title={%{item.isCorrect === null ? 'Empty' : item.isCorrect ? 'Correct' : 'Wrong'}} class="square mx-auto ${item.isCorrect === null ? 'empty' : item.isCorrect ? 'correct' : 'wrong'}"></div></td>`;
            answerTable.appendChild(trElement);
        });

        calculateScore();

        const trElement = document.createElement('tr');
        trElement.innerHTML = `
        <td colspan="3">
            Total Score: <span class="font-semibold">${totalScore} points</span>
        </td>
      <td style="text-align: center">${userAnswers.filter(item => item.isCorrect).length}/${userAnswers.length}</td>`;
        answerTable.appendChild(trElement);
    }

    function timesEnd() {
        choiceButtonElements.forEach(item => {
            item.disabled = true;
            item.checked = false;
        });
        remainingTimeElement.innerHTML = 'Times Up !';
        setTimeout(() => {
            applyChoice();
        }, 2000);
    }

    function startTimer() {
        let remaining_seconds = secondsPerQuestion;
        remainingLineElement.classList.add('remainingLine')
        remainingTimeElement.innerHTML = `Remaining Time: ${remaining_seconds} seconds`
        countdownTimer = setInterval(() => {
            remaining_seconds -= 1;
            remainingTimeElement.innerHTML = `Remaining Time: ${remaining_seconds} seconds`
            if (remaining_seconds <= secondsPerQuestion - secondsPerRead) {
                nextQuestionButtonElement.disabled = false;
            }
            if (remaining_seconds <= 0) {
                clearInterval(countdownTimer);
                timesEnd();
            }
        }, 1000);
    }

    function setQuestion(questionObject) {
        const answers = questionObject.answers;
        document.getElementById('question').innerHTML = `${currentQuestionIndex + 1}) ${questionObject.question}`
        document.getElementById('answer_a').innerHTML = `${answers[0].text}`
        document.getElementById('answer_b').innerHTML = `${answers[1].text}`
        document.getElementById('answer_c').innerHTML = `${answers[2].text}`
        document.getElementById('answer_d').innerHTML = `${answers[3].text}`
    }

    function startQuiz() {
        startContainer.classList.add('hidden');
        currentQuestion = nextQuestion();
        questionContainer.classList.remove('hidden');
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function calculateScore() {
        totalScore = 0;
        userAnswers.forEach(answer => {
            if (answer.isCorrect === true) {
                totalScore += 10;
            } else if (answer.isCorrect === false) {
                totalScore -= 5;
            } else if (answer.isCorrect === null) {
                totalScore -= 2;
            }
        });
    }

    choiceButtonElements.forEach(button => {
        button.addEventListener('click', function () {
            if (this.checked && this.dataset.waschecked === "true") {
                this.checked = false;
                this.dataset.waschecked = "false";
            } else {
                choiceButtonElements.forEach(b => b.dataset.waschecked = "false");
                this.dataset.waschecked = "true";
            }
        });
    });

});
