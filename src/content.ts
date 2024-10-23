import setupQuizResultHelper from "./quiz-result/quiz-result-helper";
import setupQuizHelper from "./quiz/quiz-helper";

const currentUrl = window.location.href;

if (currentUrl.match(/FillTest/)) {
    console.log("Quiz matched!")
    setupQuizHelper();
}

if (currentUrl.match(/ReplayTest/)) {
    console.log("Quiz result matched!")
    setupQuizResultHelper();
}