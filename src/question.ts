import { Question } from "./database";

export function renderQuestion(question: Question) {
    return `<div class="card" data-slug="${question.slug}">
        <h2>${question.question}</h2>
        <h3>${question.topic}</h3>
        <h4 class="${(question.correct ? 'correct' : 'incorrect')}">${question.correct ? 'Correct' : 'Incorrect'}</h4>
        <div class="coospace-question">
        ${question.html}
        </div>
        <button onclick="await removeQuestion('${question.slug}')">Remove</button>       
    </div>`;
}
