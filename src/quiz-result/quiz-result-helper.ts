import html2canvas from 'html2canvas';
import slug from 'slug'
import imageSource from '../content/giphy.gif';
import './quiz-result-helper.css';

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

async function saveAllQuestions() {
    const deduplication = [] as string[];

    const answerList: {
        question: string;
        answers: string[];
        imgName: string;
    }[] = [];

    while (true) {
        // second a tag
        const nextButton = document.querySelector('#page_buttons a:nth-child(2)') as HTMLAnchorElement;

        const questionsContainers = document.querySelectorAll('.mainbox');
        const questionsContainersArray = Array.from(questionsContainers);

        const questions = [];

        for (const questionContainer of questionsContainersArray) {
            const questionId = questionContainer.id;
            const questionNumber = questionId.split('_')[1] ?? 0;

            if (!questionNumber) {
                continue;
            }

            questions.push(questionNumber);
        }

        for (const questionNumber of questions) {
            const questionContainer = document.querySelector(`#question_${questionNumber}`) as HTMLDivElement;
            questionContainer.scrollIntoView();

            const good = questionContainer.classList.contains('question_good');
            const question = questionContainer.querySelector('.userhtml')?.textContent ?? '-';
            const answersDivs = questionContainer.querySelectorAll('.valids');
            const answers = answersDivs ? [...answersDivs].map((_) => _.textContent ?? '-') : [];

            const screenshot = await html2canvas(questionContainer);

            const question_slug = slug(question, { lower: true, replacement: '_' });

            if (deduplication.includes(question_slug)) {
                continue;
            } else {
                deduplication.push(question_slug);
            }

            // download

            const fileName = `question_${question_slug}_${good ? 'good' : 'bad'}.png`;

            const link = document.createElement('a');
            link.download = fileName;
            link.href = screenshot.toDataURL();
            link.click();

            answerList.push({ question, answers, imgName: fileName });
        }

        if (nextButton.classList.contains('linkbutton24_disabled')) {
            break;
        } else {
            nextButton.click();
        }
    }

    const json = JSON.stringify(answerList, null, 2);

    const link = document.createElement('a');
    link.download = `answers.json`;
    link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(json);
    link.click();
}

function orderQuestions(popover: HTMLDivElement) {

    let content = `<div> <h3>Save all answers</h3> 
            <h4> Actions </h4>
            <div class="question-actions">
                <button id="copy-answers">Save</button>
            </div>
            </div>`;

    popover.innerHTML = content;

    popover.showPopover();

    const copyButton = document.querySelector(`#copy-answers`) as HTMLButtonElement;

    copyButton.addEventListener('click', async () => {
        await saveAllQuestions();
    });
}

export default function setupQuizResultHelper() {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const clippyContainer = doc.body.firstElementChild!;
    const clippy = clippyContainer.querySelector('#clippy') as HTMLImageElement;
    const popover = clippyContainer.querySelector('#clippy-popover') as HTMLDivElement;

    clippy.addEventListener('click', () => orderQuestions(popover));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'h') {
            console.log('Toggling clippy...');
            clippyContainer.classList.toggle('hidden');
        } else if (event.key === 'l') {
            // console.log
        }
    });

    document.body.append(clippyContainer);
}
