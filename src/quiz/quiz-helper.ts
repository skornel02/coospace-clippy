import imageSource from '../content/giphy.gif';
import './quiz-helper.css';

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

function orderQuestions(popover: HTMLDivElement) {
    console.log('Ordering questions...');

    const answerRows = document.querySelectorAll('.answer_row');
    const answerRowsArray = Array.from(answerRows);

    console.log(answerRowsArray);

    // answer id: .asnwer-row > .choice_input > input[name]

    const answerIds = answerRowsArray.map((answerRow) => {
        const input = answerRow.querySelector('input');
        if (!input) {
            return '';
        }
        return input.id ?? input.name;
    });
    
    popover.innerHTML = `<div> <h3>Answer IDs:</h3> <ul>${answerIds.map(_ => `<li>${_}</li>`).join('')}</ul>`;


    popover.showPopover();
}

export default function setupQuizHelper() {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const clippyContainer = doc.body.firstElementChild!;
    const clippy = clippyContainer.querySelector('#clippy') as HTMLImageElement;
    const popover = clippyContainer.querySelector('#clippy-popover') as HTMLDivElement;

    clippy.addEventListener('click', () => orderQuestions(popover));

    document.body.append(clippyContainer);
}
