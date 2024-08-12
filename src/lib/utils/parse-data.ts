export const parseDate = (dateStr: string) => {
  const [day, month, year] = dateStr.split("-").map(Number);
  const fullYear = year < 100 ? year + 2000 : year;
  return new Date(fullYear, month - 1, day);
};
