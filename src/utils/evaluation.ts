export type EvaluationResult = {
  title: string;
  message: string;
  advice: string;
  color: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
  performance: 'perfect' | 'great' | 'good' | 'needs_work';
};

export function getSmartEvaluation(
  knownCount: number,
  learningCount: number,
  timeSpentSeconds: number,
  streak: number
): EvaluationResult {
  const total = knownCount + learningCount;
  if (total === 0) {
    return {
      title: "No Data",
      message: "You haven't reviewed any cards.",
      advice: "Start learning!",
      color: "blue",
      performance: "needs_work"
    };
  }

  const accuracy = knownCount / total;
  const speed = total / (timeSpentSeconds / 60); // cards per minute
  
  let performance: 'perfect' | 'great' | 'good' | 'needs_work' = 'good';
  let title = '';
  let message = '';
  let advice = '';
  let color: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' = 'blue';

  // 1. Determine Performance Tier & Base Title
  if (accuracy === 1) {
    performance = 'perfect';
    color = 'purple';
    const perfectTitles = ["Flawless Victory!", "Perfect Memory!", "Unstoppable!", "Mastermind!"];
    title = perfectTitles[Math.floor(Math.random() * perfectTitles.length)];
  } else if (accuracy >= 0.8) {
    performance = 'great';
    color = 'emerald';
    const greatTitles = ["Great Job!", "Almost Perfect!", "Impressive!", "Solid Work!"];
    title = greatTitles[Math.floor(Math.random() * greatTitles.length)];
  } else if (accuracy >= 0.5) {
    performance = 'good';
    color = 'amber';
    const goodTitles = ["Good Effort!", "Making Progress!", "Keep Going!", "On the Right Track!"];
    title = goodTitles[Math.floor(Math.random() * goodTitles.length)];
  } else {
    performance = 'needs_work';
    color = 'rose';
    const lowTitles = ["Needs Review", "Keep Practicing", "Don't Give Up!", "Learning Phase"];
    title = lowTitles[Math.floor(Math.random() * lowTitles.length)];
  }

  // 2. Generate Smart Message based on multiple factors
  if (performance === 'perfect') {
    if (speed > 20) {
      message = "You blasted through these cards with 100% accuracy. Your recall speed is phenomenal!";
    } else {
      message = "Not a single mistake! You took your time and it paid off perfectly.";
    }
  } else if (performance === 'great') {
    message = `You remembered ${Math.round(accuracy * 100)}% of the cards. Just a tiny bit more practice and you'll have them all down!`;
  } else if (performance === 'good') {
    message = `You got more than half right! You're building a strong foundation, but there's room for improvement.`;
  } else {
    message = `It seems these concepts are still a bit tricky. That's completely normal when learning something new!`;
  }

  // 3. Add Streak Bonus Message if applicable
  if (streak >= 3) {
    message += ` Plus, you're on a 🔥 ${streak}-day streak. Consistency is key!`;
  }

  // 4. Generate Actionable Advice
  if (performance === 'perfect') {
    advice = "You've mastered this set. Consider trying 'Test' or 'Match' mode to challenge yourself further.";
  } else if (learningCount > 0 && learningCount <= 5) {
    advice = `Focus just on the ${learningCount} card${learningCount > 1 ? 's' : ''} you missed. A quick review will lock them in.`;
  } else if (speed < 5) {
    advice = "Try not to spend too much time on a single card. If you don't know it, mark it as 'Still learning' and review it later.";
  } else {
    advice = "Take a short break and try reviewing this set again in a few hours to reinforce your memory.";
  }

  return { title, message, advice, color, performance };
}

export function getMatchEvaluation(
  timeSeconds: number,
  cardsMatched: number,
  incorrectAttempts: number
): EvaluationResult {
  const accuracy = cardsMatched / (cardsMatched + incorrectAttempts);
  
  let performance: 'perfect' | 'great' | 'good' | 'needs_work' = 'good';
  let title = '';
  let message = '';
  let advice = '';
  let color: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' = 'blue';

  if (incorrectAttempts === 0 && timeSeconds < 15) {
    performance = 'perfect';
    color = 'purple';
    title = 'Lightning Fast!';
    message = `Incredible! You cleared the board flawlessly in just ${timeSeconds.toFixed(1)} seconds.`;
    advice = 'Try to beat your own record next time!';
  } else if (incorrectAttempts <= 1) {
    performance = 'great';
    color = 'emerald';
    title = 'Sharp Eye!';
    message = `Great job! Very few mistakes and a solid time of ${timeSeconds.toFixed(1)}s.`;
    advice = 'You can definitely shave a few more seconds off your time.';
  } else if (accuracy >= 0.6) {
    performance = 'good';
    color = 'amber';
    title = 'Good Match!';
    message = `You finished the match in ${timeSeconds.toFixed(1)}s. You're getting the hang of it.`;
    advice = 'Focus on memorizing the positions before clicking to reduce incorrect attempts.';
  } else {
    performance = 'needs_work';
    color = 'rose';
    title = 'Keep Trying!';
    message = `You completed the match, but made quite a few random guesses.`;
    advice = 'Take it slower! Accuracy is more important than speed when you are just starting out.';
  }

  return { title, message, advice, color, performance };
}

export function getTestEvaluation(
  scorePercentage: number,
  correctCount: number,
  incorrectCount: number
): EvaluationResult {
  let performance: 'perfect' | 'great' | 'good' | 'needs_work' = 'good';
  let title = '';
  let message = '';
  let advice = '';
  let color: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' = 'blue';

  if (scorePercentage === 100) {
    performance = 'perfect';
    color = 'purple';
    title = 'Flawless Victory!';
    message = 'You answered every single question correctly! Outstanding performance.';
    advice = 'You have mastered this material. Keep up the excellent work!';
  } else if (scorePercentage >= 80) {
    performance = 'great';
    color = 'emerald';
    title = 'Great Score!';
    message = `You scored ${scorePercentage}%! You clearly understand most of the concepts.`;
    advice = `Review the ${incorrectCount} question${incorrectCount > 1 ? 's' : ''} you missed to reach perfection.`;
  } else if (scorePercentage >= 50) {
    performance = 'good';
    color = 'amber';
    title = 'Solid Effort!';
    message = `You got ${scorePercentage}%. You have a decent grasp, but there's room to grow.`;
    advice = 'Go back to Flashcards or Learn mode to solidify the concepts you missed.';
  } else {
    performance = 'needs_work';
    color = 'rose';
    title = 'Needs Review';
    message = `You scored ${scorePercentage}%. This test was tough, but don't get discouraged!`;
    advice = 'It is highly recommended to study the set using Learn mode before taking the test again.';
  }

  return { title, message, advice, color, performance };
}

export function getLearnEvaluation(
  wordsLearned: number,
  totalReviews: number,
  accuracy: number
): EvaluationResult {
  let performance: 'perfect' | 'great' | 'good' | 'needs_work' = 'good';
  let title = '';
  let message = '';
  let advice = '';
  let color: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' = 'blue';

  if (accuracy >= 0.95) {
    performance = 'perfect';
    color = 'purple';
    title = 'Fast Learner!';
    message = 'You absorbed these words incredibly fast with almost perfect accuracy.';
    advice = 'Take a test to prove your mastery of these terms.';
  } else if (accuracy >= 0.75) {
    performance = 'great';
    color = 'emerald';
    title = 'Great Progress!';
    message = `You learned ${wordsLearned} new words today with solid accuracy.`;
    advice = 'You are on the right track. Consistency is the secret to long-term memory.';
  } else if (accuracy >= 0.5) {
    performance = 'good';
    color = 'amber';
    title = 'Keep Going!';
    message = `Learning takes time. You completed ${totalReviews} reviews to master these words.`;
    advice = 'Spaced repetition is working. Don\'t forget to review these words tomorrow.';
  } else {
    performance = 'needs_work';
    color = 'rose';
    title = 'Hard Work Pays Off';
    message = `It took ${totalReviews} reviews, but you didn't give up!`;
    advice = 'Some words are just harder to stick. Try creating your own examples to remember them better.';
  }

  return { title, message, advice, color, performance };
}
