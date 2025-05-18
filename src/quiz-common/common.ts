import html2canvas from "html2canvas";

export let inlineIdsEnabled = false;

export function getQuestionContainers() {
    const questionsContainers = document.querySelectorAll('#top-container .mainbox');
    const questionsContainersArray = Array.from(questionsContainers);

    return questionsContainersArray;
}

export function getElementsFromQuestionContainer(questionContainer: Element) {
    const questionIdInTest = questionContainer.id;
    const questionNumber = questionIdInTest.split('_')[1] ?? 0;

    if (!questionNumber) {
        return { questionNumber, question: null, answerRowsArray: null };
    }

    const question = questionContainer.querySelector('.userhtml')?.textContent ?? '-';
    const answerRows = document.querySelectorAll(`#question_${questionNumber} .answer_row`);
    const answerRowsArray = Array.from(answerRows);

    return { questionNumber, question, answerRowsArray };
}

export function getAnswerIdsFromAnswerRows(answerRows: Element[]) {
    const answerIds = answerRows.map((answerRow) => {
        const input = answerRow.querySelector('input');
        if (!input) {
            return '';
        }
        return input.id ?? input.name;
    });

    return answerIds;
}

export async function screenshotElement(element: HTMLElement, filename: string) {
    element.scrollIntoView();

    const screenshot = await html2canvas(element);

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = screenshot.toDataURL();
    link.click();
}

export function displayAnswerIdsInForm() {
    if (document.querySelectorAll('.clippy-answer-id').length > 0) 
        return;

    const questionsContainersArray = getQuestionContainers();

    for (const questionContainer of questionsContainersArray) {
        const { questionNumber, question, answerRowsArray } = getElementsFromQuestionContainer(questionContainer);

        if (!questionNumber || !question || !answerRowsArray) {
            continue;
        }

        const answerIds = getAnswerIdsFromAnswerRows(answerRowsArray);

        for (const [index, answerRow] of answerRowsArray.entries()) {
            const label = document.createElement('div');
            const id = answerIds[index].split('_').reduce((_, curr) => {
                if (curr === 'na' || curr === 't' || curr === 'f') {
                    return '';
                }
                return curr;
            }, '');
            label.innerText = id;

            label.classList.add('clippy-answer-id');
            label.style.display = 'table-cell';

            if (id === '') {
                answerRow.append(label);
                continue;
            }

            /* Adding this for screenshot purposes. */
            label.style.borderLeft = '1px dotted rgba(0, 0, 0, 0.2)';
            label.style.padding = '0 10px';
            label.style.verticalAlign = 'middle';
            label.style.textAlign = 'center';
            answerRow.append(label);
        }
    }

    inlineIdsEnabled = true;
}

export function hideAnswerIdsInForm() {
    const answerIds = document.querySelectorAll('.clippy-answer-id');
    for (const answerId of answerIds) {
        answerId.remove();
    }
    inlineIdsEnabled = false;
}

export function toggleAnswerIdsInForm() {
    const answerIds = document.querySelectorAll('.clippy-answer-id');

    if (answerIds.length > 0) {
        hideAnswerIdsInForm();
    } else {
        displayAnswerIdsInForm();
    }
    console.log('Toggling answer ids in form...');
}