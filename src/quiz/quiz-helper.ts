import imageSource from '../content/giphy.gif';
import './quiz-helper.css';
import { getQuestions, Question } from '../database';
import slug from 'slug';
import { renderQuestion } from '../question';
import {
    displayAnswerIdsInForm,
    getAnswerIdsFromAnswerRows,
    getElementsFromQuestionContainer,
    getQuestionContainers,
    inlineIdsEnabled,
    screenshotElement,
    toggleAnswerIdsInForm,
} from '../quiz-common/common';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

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
let isClippyVisible = true;

function orderQuestions(popover: HTMLDivElement) {
    console.log('Querying questions...');
    const questionsContainersArray = getQuestionContainers();

    let content = '';

    const questions = [];

    for (const questionContainer of questionsContainersArray) {
        const { questionNumber, question, answerRowsArray } = getElementsFromQuestionContainer(questionContainer);

        if (!questionNumber || !question || !answerRowsArray) {
            continue;
        }

        const question_slug = slug(question, { lower: true, replacement: '_' });

        questions.push(questionNumber);

        console.log(`Ordering questions for question ${questionNumber}...`);

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
                <button id="copy-all-answers">Save all</button>
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

            await screenshotElement(questionContainer, `question_${questionNumber}`);
        });
    }

    const copyAllButton = document.querySelector(`#copy-all-answers`) as HTMLButtonElement;
    copyAllButton.addEventListener('click', async () => {
        console.log('Copying all answers...');
        popover.hidePopover();
        exportQuestions();
    });
}

function onPageChange() {
    console.log('Page changed...');
    deregisterListenersForPageChange();

    setTimeout(() => {
        if (isClippyVisible && inlineIdsEnabled) {
            displayAnswerIdsInForm();
        }
        registerListenersForPageChange();
    }, 200);
}

function deregisterListenersForPageChange() {
    const prevNextButtons = document.querySelectorAll('.linkbutton24');
    const pageButtons = document.querySelectorAll('#pager_pages .page');
    const combinedButtons = [...prevNextButtons, ...pageButtons];

    combinedButtons.forEach((button) => {
        const text = button.textContent?.toLowerCase() ?? '';
        if (button.classList.contains('page') || text.includes('oldal') || text.includes('page')) {
            button.removeEventListener('click', onPageChange);
        }
    });
}

function registerListenersForPageChange() {
    const prevNextButtons = document.querySelectorAll('.linkbutton24');
    const pageButtons = document.querySelectorAll('#pager_pages .page');
    const combinedButtons = [...prevNextButtons, ...pageButtons];

    combinedButtons.forEach((button) => {
        const text = button.textContent?.toLowerCase() ?? '';
        if (button.classList.contains('page') || text.includes('oldal') || text.includes('page')) {
            button.addEventListener('click', onPageChange);
        }
    });
}

async function exportQuestions() {
    console.log('Exporting questions...');

    //Jump to the first page
    const pager_pages = document.querySelector('#pager_pages') as HTMLDivElement;
    const pageButtons = pager_pages.querySelectorAll('.page') as NodeListOf<HTMLAnchorElement>;
    pageButtons[0].click();

    //Jump to the first question
    const pager_questions = document.querySelector('#pager_questions') as HTMLDivElement;
    const questionsList = pager_questions.querySelectorAll('.question') as NodeListOf<HTMLAnchorElement>;
    questionsList[0].click();

    const zip = new JSZip();

    while (true) {
        const questionsContainersArray = getQuestionContainers().reverse() as HTMLDivElement[];
        const nextButton = document.querySelectorAll('.linkbutton24')[1] as HTMLAnchorElement;

        displayAnswerIdsInForm();

        for (const questionContainer of questionsContainersArray) {
            const { questionNumber, question } = getElementsFromQuestionContainer(questionContainer);

            if (!questionNumber) {
                continue;
            }

            const question_slug = slug(question ?? 'question', { lower: true, replacement: '_' });
            const fileName = `${question_slug.split('_').slice(0, 15).join('_')}_${questionNumber}`;
            questionContainer.scrollIntoView();

            const screenshot = await html2canvas(questionContainer);

            const imgData = screenshot.toDataURL();
            const imgBlob = await (await fetch(imgData)).blob();
            const imgName = `${fileName}.png`;
            zip.file(imgName, imgBlob);
        }

        if (nextButton.classList.contains('linkbutton24_disabled')) {
            break;
        } else {
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 800 + 200));
            nextButton.click();
        }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipName = `questions_${new Date().toISOString()}.zip`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = zipName;
    link.click();
    URL.revokeObjectURL(link.href);
}

export default function setupQuizHelper() {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const clippyContainer = doc.body.firstElementChild!;
    const clippy = clippyContainer.querySelector('#clippy') as HTMLImageElement;
    const popover = clippyContainer.querySelector('#clippy-popover') as HTMLDivElement;

    getQuestions().then((questions) => {
        previousQuestions = questions;
    });

    clippy.addEventListener('click', () => orderQuestions(popover));

    registerListenersForPageChange();
    if (isClippyVisible && inlineIdsEnabled) {
        displayAnswerIdsInForm();
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'h') {
            console.log('Toggling clippy...');
            clippyContainer.classList.toggle('hidden');

            const hidden = clippyContainer.classList.contains('hidden');
            isClippyVisible = !isClippyVisible;

            chrome.storage.local.set({ hidden });
        } else if (event.key === 'l') {
            toggleAnswerIdsInForm();
        }
    });

    chrome.storage.local.get('hidden', (result) => {
        if (result.hidden) {
            clippyContainer.classList.add('hidden');
        }
    });

    document.body.append(clippyContainer);
}
