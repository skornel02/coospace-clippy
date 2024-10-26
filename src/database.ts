export interface Question {
    slug: string;
    topic: string;
    correct: boolean;
    question: string;
    answers: string[];
    imgName: string;
    html: string;
}

export async function getQuestions() {
    const storedQuestions: Question[] = (await chrome.storage.local.get('questions')).questions ?? [];

    return storedQuestions;
}

export async function saveQuestions(questions: Question[]) {
    await chrome.storage.local.set({ questions });
}

export async function addQuestion(question: Question) {
    const storedQuestions = await getQuestions();

    storedQuestions.push(question);

    await saveQuestions(storedQuestions);
}

export async function removeQuestion(questionSlug: string) {
    const storedQuestions = await getQuestions();

    const newQuestions = storedQuestions.filter((_) => _.slug !== questionSlug);

    await saveQuestions(newQuestions);
}
