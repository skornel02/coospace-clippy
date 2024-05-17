import setupQuizHelper from "./quiz/quiz-helper";

const currentUrl = window.location.href;

if (currentUrl.match(/FillTest/)) {
    console.log("Quiz matched!")
    setupQuizHelper();
}