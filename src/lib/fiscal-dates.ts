/**
 * Utility functions for Wings fiscal year calculations
 * Wings fiscal years start on Monday and end on Sunday
 * Each fiscal year starts on the Monday closest to January 1st
 */

/**
 * Get the Monday closest to January 1st of the given year
 */
function getMondayClosestToJan1(year: number): Date {
  const jan1 = new Date(year, 0, 1); // January 1st
  const dayOfWeek = jan1.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  let mondayDate: Date;
  
  if (dayOfWeek === 0) {
    // Jan 1 is Sunday, Monday is the next day
    mondayDate = new Date(year, 0, 2);
  } else if (dayOfWeek === 1) {
    // Jan 1 is Monday
    mondayDate = new Date(year, 0, 1);
  } else if (dayOfWeek <= 4) {
    // Jan 1 is Tue-Thu, go back to previous Monday
    mondayDate = new Date(year, 0, 1 - (dayOfWeek - 1));
  } else {
    // Jan 1 is Fri-Sat, go forward to next Monday
    mondayDate = new Date(year, 0, 1 + (8 - dayOfWeek));
  }
  
  return mondayDate;
}

/**
 * Get the fiscal year start date for a given calendar year
 */
export function getFiscalYearStart(calendarYear: number): Date {
  return getMondayClosestToJan1(calendarYear);
}

/**
 * Get the fiscal year end date for a given calendar year
 * This is the Sunday before the next fiscal year starts
 */
export function getFiscalYearEnd(calendarYear: number): Date {
  const nextYearStart = getMondayClosestToJan1(calendarYear + 1);
  const fiscalYearEnd = new Date(nextYearStart);
  fiscalYearEnd.setDate(nextYearStart.getDate() - 1); // Previous Sunday
  return fiscalYearEnd;
}

/**
 * Get the current fiscal year dates (start and end)
 */
export function getCurrentFiscalYear(): { start: Date; end: Date } {
  const today = new Date();
  const currentCalendarYear = today.getFullYear();
  
  // Check if we're in the current fiscal year or next
  const currentFYStart = getFiscalYearStart(currentCalendarYear);
  const currentFYEnd = getFiscalYearEnd(currentCalendarYear);
  
  if (today >= currentFYStart && today <= currentFYEnd) {
    // We're in the current calendar year's fiscal year
    return {
      start: currentFYStart,
      end: currentFYEnd
    };
  } else if (today < currentFYStart) {
    // We're before the current fiscal year started, so we're in last year's
    return {
      start: getFiscalYearStart(currentCalendarYear - 1),
      end: getFiscalYearEnd(currentCalendarYear - 1)
    };
  } else {
    // We're after the current fiscal year ended, so we're in next year's
    return {
      start: getFiscalYearStart(currentCalendarYear + 1),
      end: getFiscalYearEnd(currentCalendarYear + 1)
    };
  }
}

/**
 * Get the previous fiscal year dates
 */
export function getPreviousFiscalYear(): { start: Date; end: Date } {
  const today = new Date();
  const currentCalendarYear = today.getFullYear();
  
  // Determine what fiscal year we're currently in
  const currentFYStart = getFiscalYearStart(currentCalendarYear);
  const currentFYEnd = getFiscalYearEnd(currentCalendarYear);
  
  let currentFiscalYearNumber: number;
  
  if (today >= currentFYStart && today <= currentFYEnd) {
    // We're in the current calendar year's fiscal year
    currentFiscalYearNumber = currentCalendarYear;
  } else if (today < currentFYStart) {
    // We're in the previous calendar year's fiscal year
    currentFiscalYearNumber = currentCalendarYear - 1;
  } else {
    // We're in the next calendar year's fiscal year
    currentFiscalYearNumber = currentCalendarYear + 1;
  }
  
  // Previous fiscal year is one year before the current fiscal year
  const previousFiscalYearNumber = currentFiscalYearNumber - 1;
  
  return {
    start: getFiscalYearStart(previousFiscalYearNumber),
    end: getFiscalYearEnd(previousFiscalYearNumber)
  };
}

/**
 * Get Year To Date for fiscal year (from fiscal year start to today)
 */
export function getFiscalYTD(): { start: Date; end: Date } {
  const currentFY = getCurrentFiscalYear();
  return {
    start: currentFY.start,
    end: new Date() // Today
  };
}

/**
 * Get the current week (Monday to Sunday)
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to subtract to get to Monday
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0); // Start of day
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999); // End of day
  
  return {
    start: monday,
    end: sunday
  };
}

/**
 * Get the last week (Monday to Sunday of previous week)
 */
export function getLastWeek(): { start: Date; end: Date } {
  const currentWeek = getCurrentWeek();
  
  const lastMonday = new Date(currentWeek.start);
  lastMonday.setDate(currentWeek.start.getDate() - 7);
  
  const lastSunday = new Date(currentWeek.end);
  lastSunday.setDate(currentWeek.end.getDate() - 7);
  
  return {
    start: lastMonday,
    end: lastSunday
  };
}

/**
 * Get the current fiscal month (Monday to Sunday boundaries)
 * Fiscal months always start on Monday and end on Sunday
 * Based on the pattern: Sept 2025 = 9/1/2025 to 9/28/2025, Aug 2025 = 7/28/2025 to 8/31/2025
 */
export function getCurrentFiscalMonth(): { start: Date; end: Date } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // Get the first day of the current month
  const firstOfMonth = new Date(year, month, 1);
  
  // Find the Monday that's closest to the 1st of the month
  let fiscalMonthStart: Date;
  
  const dayOfWeek = firstOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  if (dayOfWeek === 1) {
    // If 1st is Monday, use it
    fiscalMonthStart = new Date(firstOfMonth);
  } else if (dayOfWeek === 0) {
    // If 1st is Sunday, use the next Monday (2nd)
    fiscalMonthStart = new Date(year, month, 2);
  } else if (dayOfWeek <= 4) {
    // If 1st is Tue-Thu, go back to previous Monday
    fiscalMonthStart = new Date(year, month, 1 - (dayOfWeek - 1));
  } else {
    // If 1st is Fri-Sat, go forward to next Monday
    fiscalMonthStart = new Date(year, month, 1 + (8 - dayOfWeek));
  }
  
  // Calculate the end date - this should be the Sunday before the next fiscal month starts
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const firstOfNextMonth = new Date(nextYear, nextMonth, 1);
  
  let nextFiscalMonthStart: Date;
  const nextDayOfWeek = firstOfNextMonth.getDay();
  
  if (nextDayOfWeek === 1) {
    nextFiscalMonthStart = new Date(firstOfNextMonth);
  } else if (nextDayOfWeek === 0) {
    nextFiscalMonthStart = new Date(nextYear, nextMonth, 2);
  } else if (nextDayOfWeek <= 4) {
    nextFiscalMonthStart = new Date(nextYear, nextMonth, 1 - (nextDayOfWeek - 1));
  } else {
    nextFiscalMonthStart = new Date(nextYear, nextMonth, 1 + (8 - nextDayOfWeek));
  }
  
  // End date is the Sunday before next fiscal month starts
  const fiscalMonthEnd = new Date(nextFiscalMonthStart);
  fiscalMonthEnd.setDate(nextFiscalMonthStart.getDate() - 1);
  fiscalMonthEnd.setHours(23, 59, 59, 999);
  
  return {
    start: fiscalMonthStart,
    end: fiscalMonthEnd
  };
}

/**
 * Get the previous fiscal month (Monday to Sunday boundaries)
 */
export function getPreviousFiscalMonth(): { start: Date; end: Date } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // Get previous calendar month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  
  // Calculate fiscal month for previous calendar month using same logic
  const firstOfPrevMonth = new Date(prevYear, prevMonth, 1);
  
  let fiscalMonthStart: Date;
  const dayOfWeek = firstOfPrevMonth.getDay();
  
  if (dayOfWeek === 1) {
    fiscalMonthStart = new Date(firstOfPrevMonth);
  } else if (dayOfWeek === 0) {
    fiscalMonthStart = new Date(prevYear, prevMonth, 2);
  } else if (dayOfWeek <= 4) {
    fiscalMonthStart = new Date(prevYear, prevMonth, 1 - (dayOfWeek - 1));
  } else {
    fiscalMonthStart = new Date(prevYear, prevMonth, 1 + (8 - dayOfWeek));
  }
  
  // Calculate end date - Sunday before current fiscal month starts
  const currentFiscalMonth = getCurrentFiscalMonth();
  const fiscalMonthEnd = new Date(currentFiscalMonth.start);
  fiscalMonthEnd.setDate(currentFiscalMonth.start.getDate() - 1);
  fiscalMonthEnd.setHours(23, 59, 59, 999);
  
  return {
    start: fiscalMonthStart,
    end: fiscalMonthEnd
  };
}

/**
 * Get fiscal month to date (from fiscal month start to yesterday, excluding today)
 */
export function getFiscalMonthToDate(): { start: Date; end: Date } {
  const currentMonth = getCurrentFiscalMonth();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999); // End of yesterday
  
  return {
    start: currentMonth.start,
    end: yesterday
  };
}

/**
 * Get last year's equivalent fiscal month-to-date period
 * Uses the same fiscal month structure and same number of days as current period
 */
export function getLastYearFiscalMonthToDate(): { start: Date; end: Date } {
  const currentMTD = getFiscalMonthToDate();
  
  // Calculate number of days in current month-to-date period
  const daysDiff = Math.floor((currentMTD.end.getTime() - currentMTD.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Get last year's equivalent fiscal month
  const today = new Date();
  const lastYear = today.getFullYear() - 1;
  const currentMonth = today.getMonth();
  
  // Calculate last year's fiscal month start using same logic
  const firstOfLastYearMonth = new Date(lastYear, currentMonth, 1);
  let lastYearFiscalStart: Date;
  
  const dayOfWeek = firstOfLastYearMonth.getDay();
  
  if (dayOfWeek === 1) {
    lastYearFiscalStart = new Date(firstOfLastYearMonth);
  } else if (dayOfWeek === 0) {
    lastYearFiscalStart = new Date(lastYear, currentMonth, 2);
  } else if (dayOfWeek <= 4) {
    lastYearFiscalStart = new Date(lastYear, currentMonth, 1 - (dayOfWeek - 1));
  } else {
    lastYearFiscalStart = new Date(lastYear, currentMonth, 1 + (8 - dayOfWeek));
  }
  
  // Calculate end date by adding the same number of days as current period
  const lastYearEnd = new Date(lastYearFiscalStart);
  lastYearEnd.setDate(lastYearFiscalStart.getDate() + daysDiff - 1);
  lastYearEnd.setHours(23, 59, 59, 999);
  
  return {
    start: lastYearFiscalStart,
    end: lastYearEnd
  };
}

/**
 * Format date as YYYY-MM-DD for API calls
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}
