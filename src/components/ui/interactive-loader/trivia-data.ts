import { TriviaQuestion, LoadingContextDomain } from './types';

export const TRIVIA_BANK: Record<LoadingContextDomain, TriviaQuestion[]> = {
  scholarship_match: [
    {
      id: 'sm1',
      category: 'scholarship_match',
      question: 'What is the number one reason students miss out on scholarship funding?',
      options: [
        { id: 'o1', text: 'Low GPA', isCorrect: false },
        { id: 'o2', text: 'Missing Deadlines', isCorrect: true },
        { id: 'o3', text: 'Bad essays', isCorrect: false },
        { id: 'o4', text: 'Income too high', isCorrect: false },
      ],
      explanation: 'Missing deadlines is the most common reason! Even perfect applicants lose out if they apply a day late.',
      difficulty: 'easy',
    },
    {
      id: 'sm2',
      category: 'scholarship_match',
      question: 'Approximately how much scholarship money goes unclaimed every year globally?',
      options: [
        { id: 'o1', text: '$100 Million', isCorrect: false },
        { id: 'o2', text: '$500 Million', isCorrect: false },
        { id: 'o3', text: 'Over $1 Billion', isCorrect: false },
        { id: 'o4', text: 'Over $3 Billion', isCorrect: true },
      ],
      explanation: 'Over $3 billion goes unclaimed annually simply because students do not apply for them!',
      difficulty: 'medium',
    }
  ],
  general: [
    {
      id: 'g1',
      category: 'general',
      question: 'Which of the following is considered a "soft skill"?',
      options: [
        { id: 'o1', text: 'Python Programming', isCorrect: false },
        { id: 'o2', text: 'Data Analysis', isCorrect: false },
        { id: 'o3', text: 'Emotional Intelligence', isCorrect: true },
        { id: 'o4', text: 'Accounting', isCorrect: false },
      ],
      explanation: 'Emotional intelligence is a critical soft skill that helps you communicate and collaborate effectively.',
      difficulty: 'easy',
    }
  ],
  course_enrollment: [],
  video_processing: [],
  certificate_generation: []
};

// Fallback to general if the domain doesn't have trivia yet
export const getTriviaForDomain = (domain: LoadingContextDomain): TriviaQuestion[] => {
  const bank = TRIVIA_BANK[domain];
  return bank && bank.length > 0 ? bank : TRIVIA_BANK['general'];
};
