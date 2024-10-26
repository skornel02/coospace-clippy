import './style.css';
import { setupCounter } from './counter.ts';
import { getQuestions, removeQuestion } from './database.ts';
import { renderQuestion } from './question.ts';


getQuestions()
  .then((questions) => {
    const topics = [...new Set(questions.map((question) => question.topic))];

    const html = `<option value="-">All</option>
          ${topics.map((topic) => `<option value="${topic}">${topic}</option>`).join('')}`;

    document.getElementById('topic')!.innerHTML = html;
  });

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Clippy</h1>
    <h2>Questions</h2>
    <div id="question-filters">
      <div>
        <label for="topic">Topic:</label>
        <select id="topic">
          
        </select>
      </div>
      <div>
        <label for="correntOnly">Correct only:</label>
        <input type="checkbox" id="correctOnly">
      </div>
    </div>
    <div id="question-container">
      
    </div>
  </div>
`;

document.querySelector<HTMLDivElement>('#question-filters')!.addEventListener('change', async () => {
    await renderQuestionContainer();
});

async function renderQuestionContainer() {
    const questions = await getQuestions();

    const questionContainer = document.getElementById('question-container')!;

    const filteredQuestions = questions.filter((question) => {
        const selectedTopic = (document.getElementById('topic') as HTMLSelectElement).value;
        const correctOnly = (document.getElementById('correctOnly') as HTMLInputElement).checked;

        if (selectedTopic !== '-' && question.topic !== selectedTopic) {
            return false;
        }

        if (correctOnly && !question.correct) {
            return false;
        }

        return true;
    });

    questionContainer.innerHTML = filteredQuestions.map((question) => renderQuestion(question)).join('');

    const cards = document.querySelectorAll('.card');

    cards.forEach((card) => {
        card.querySelector('button')!.addEventListener('click', async () => {
            const questionSlug = card.getAttribute('data-slug')!;

            await removeQuestion(questionSlug);
            await renderQuestionContainer();
        });
    });
}

renderQuestionContainer();

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
