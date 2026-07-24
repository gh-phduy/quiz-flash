function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const nextReviewDate = new Date();
let intervalDays = 1;
nextReviewDate.setDate(nextReviewDate.getDate() + Math.max(1, intervalDays));
nextReviewDate.setHours(0, 0, 0, 0);

console.log("nextReviewDateStr:", formatDateToYYYYMMDD(nextReviewDate));
