import html2canvas from 'html2canvas';
import imageSource from '../content/giphy.gif';
import './quiz-helper.css';
import { getQuestions, Question } from '../database';
import slug from 'slug';
import { renderQuestion } from '../question';

const isChrome = navigator.userAgent.includes('Chrome');

let src = imageSource;
if (isChrome) {
    src = chrome.runtime.getURL(src);
}

const html = `
<div id="clippy-container">
  <img id="clippy" src=${src} popovertarget="clippy-popover" popovertargetaction="show">
  <div id="clippy-popover" popover>
    Hello!
  </div>
</div>
`;

let previousQuestions: Question[] = [];

function orderQuestions(popover: HTMLDivElement) {
    console.log('Querying questions...');
    const questionsContainers = document.querySelectorAll('#top-container .mainbox');
    const questionsContainersArray = Array.from(questionsContainers);

    let content = '';

    const questions = [];

    for (const questionContainer of questionsContainersArray) {
        const questionId = questionContainer.id;
        const questionNumber = questionId.split('_')[1] ?? 0;

        if (!questionNumber) {
            continue;
        }
        
        const question = questionContainer.querySelector('.userhtml')?.textContent ?? '-';
        const question_slug = slug(question, { lower: true, replacement: '_' });

        questions.push(questionNumber);

        console.log(`Ordering questions for question ${questionNumber}...`);

        const answerRows = document.querySelectorAll(`#question_${questionNumber} .answer_row`);
        const answerRowsArray = Array.from(answerRows);

        console.log(answerRowsArray);

        const answerIds = answerRowsArray.map((answerRow) => {
            const input = answerRow.querySelector('input');
            if (!input) {
                return '';
            }
            return input.id ?? input.name;
        });

        content += `
            <div> <h3>Question ${questionNumber}</h3> 
            <h4> Answers </h4>
            <ul>
                ${answerIds.map((_) => `<li>${_}</li>`).join('')}
            </ul>
            <h4> Actions </h4>
            <div class="question-actions">
                <button id="copy-answers-${questionNumber}">Copy</button>
            </div>
        `;


        const matchingPreviousQuestion = previousQuestions.find((_) => _.slug === question_slug);

        if (matchingPreviousQuestion) {
            content += renderQuestion(matchingPreviousQuestion);   
        }        
    }

    popover.innerHTML = content;

    popover.showPopover();

    for (const questionNumber of questions) {
        const copyButton = document.querySelector(`#copy-answers-${questionNumber}`) as HTMLButtonElement;

        copyButton.addEventListener('click', async () => {
            console.log(`Copying answers for question ${questionNumber}...`);

            //capture screenshot

            const questionContainer = document.querySelector(`#question_${questionNumber}`) as HTMLDivElement;
            questionContainer.scrollIntoView();

            const screenshot = await html2canvas(questionContainer);

            // download

            const link = document.createElement('a');
            link.download = `question_${questionNumber}.png`;
            link.href = screenshot.toDataURL();
            link.click();
        });
    }
}

export default function setupQuizHelper() {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const clippyContainer = doc.body.firstElementChild!;
    const clippy = clippyContainer.querySelector('#clippy') as HTMLImageElement;
    const popover = clippyContainer.querySelector('#clippy-popover') as HTMLDivElement;

    getQuestions().then((questions) => {
        previousQuestions = questions
    });

    clippy.addEventListener('click', () => orderQuestions(popover));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'h') {
            console.log('Toggling clippy...');
            clippyContainer.classList.toggle('hidden');

            const hidden = clippyContainer.classList.contains('hidden');

            chrome.storage.local.set({ hidden });
        } else if (event.key === 'l') {
            // console.log
        }
    });

    chrome.storage.local.get('hidden', (result) => {
        if (result.hidden) {
            clippyContainer.classList.add('hidden');
        }
    });    

    document.body.append(clippyContainer);
}
