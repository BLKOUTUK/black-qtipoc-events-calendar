import { Event } from '../types';

export const getWeekStartingFrom = (startDate: Date, targetDate: Date): number => {
  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
};

export const getWeekRange = (startDate: Date, weekNumber: number): { start: Date; end: Date } => {
  const weekStart = new Date(startDate);
  weekStart.setDate(startDate.getDate() + (weekNumber * 7));

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return { start: weekStart, end: weekEnd };
};

export const formatWeekRange = (start: Date, end: Date): string => {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

export const getWeekTitle = (weekNumber: number, start: Date, end: Date): string => {
  const today = new Date();
  const weekStart = new Date(start);
  const weekEnd = new Date(end);

  // Reset time to compare dates only
  today.setHours(0, 0, 0, 0);
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  // Check if this week contains today
  if (today >= weekStart && today <= weekEnd) {
    return `This Week • ${formatWeekRange(start, end)}`;
  }

  // Check if this is next week (starts within 7 days from today)
  const daysUntilWeekStart = Math.ceil((weekStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilWeekStart > 0 && daysUntilWeekStart <= 7) {
    return `Next Week • ${formatWeekRange(start, end)}`;
  }

  // All other weeks
  return `Week of ${formatWeekRange(start, end)}`;
};

export const groupEventsByWeek = (events: Event[], startDate: Date = new Date('2025-09-30')): { [week: number]: { events: Event[]; title: string; range: { start: Date; end: Date } } } => {
  const grouped: { [week: number]: { events: Event[]; title: string; range: { start: Date; end: Date } } } = {};

  // Get current date and determine if we should filter past events
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();

  // Filter out past weeks if it's Sunday night (after 8pm) or Monday onwards
  const shouldFilterPastWeeks = currentDay === 0 && currentHour >= 20; // Sunday 8pm onwards
  const shouldFilterPastWeeksMonday = currentDay >= 1; // Monday onwards

  const currentWeekNumber = getWeekStartingFrom(startDate, now);

  events.forEach(event => {
    const eventDate = new Date(event.date || event.event_date);
    const weekNumber = getWeekStartingFrom(startDate, eventDate);

    // DISABLED: Don't filter past weeks - show all approved events
    // This was filtering out events because they were from "past weeks" relative to Sept 30, 2025
    // if ((shouldFilterPastWeeks || shouldFilterPastWeeksMonday) && weekNumber < currentWeekNumber) {
    //   return; // Skip this event
    // }

    if (!grouped[weekNumber]) {
      const range = getWeekRange(startDate, weekNumber);
      grouped[weekNumber] = {
        events: [],
        title: getWeekTitle(weekNumber, range.start, range.end),
        range
      };
    }

    grouped[weekNumber].events.push(event);
  });

  // Sort events within each week by date
  Object.keys(grouped).forEach(week => {
    grouped[parseInt(week)].events.sort((a, b) => {
      const dateA = new Date(a.date || a.event_date);
      const dateB = new Date(b.date || b.event_date);
      return dateA.getTime() - dateB.getTime();
    });
  });

  return grouped;
};