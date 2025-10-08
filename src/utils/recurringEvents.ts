import { RecurrenceRule, Event } from '../types';

/**
 * Generate recurring event instances based on recurrence rule
 */
export function generateRecurringInstances(
  parentEvent: Event,
  rule: RecurrenceRule,
  maxInstances: number = 100
): Partial<Event>[] {
  const instances: Partial<Event>[] = [];
  const startDate = new Date(parentEvent.start_date || parentEvent.event_date || '');
  const endDate = new Date(parentEvent.end_date || parentEvent.start_date || parentEvent.event_date || '');
  const eventDuration = endDate.getTime() - startDate.getTime();

  let currentDate = new Date(startDate);
  let count = 0;

  // Determine end condition
  const maxDate = rule.endDate ? new Date(rule.endDate) : new Date('2026-12-31');
  const maxCount = rule.endAfterOccurrences || maxInstances;

  while (count < maxCount && currentDate <= maxDate) {
    // Move to next occurrence based on frequency
    if (count > 0) {
      switch (rule.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + rule.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * rule.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + rule.interval);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + rule.interval);
          break;
      }
    }

    // Check if date matches the recurrence pattern
    let shouldInclude = true;

    if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      shouldInclude = rule.daysOfWeek.includes(currentDate.getDay());
    }

    if (rule.frequency === 'monthly' && rule.monthlyType === 'dayOfWeek') {
      const weekOfMonth = Math.ceil(currentDate.getDate() / 7);
      const dayOfWeek = currentDate.getDay();
      shouldInclude =
        rule.weekOfMonth === weekOfMonth &&
        rule.daysOfWeek?.includes(dayOfWeek) || false;
    }

    if (shouldInclude && currentDate <= maxDate) {
      const instanceStartDate = new Date(currentDate);
      const instanceEndDate = new Date(currentDate.getTime() + eventDuration);

      instances.push({
        title: parentEvent.title,
        description: parentEvent.description,
        start_date: instanceStartDate.toISOString().split('T')[0],
        end_date: instanceEndDate.toISOString().split('T')[0],
        location: parentEvent.location,
        organizer_id: parentEvent.organizer_id,
        event_type: parentEvent.event_type,
        cost: parentEvent.cost,
        tags: parentEvent.tags,
        status: 'draft', // New instances start as draft
        recurrence_parent_id: parentEvent.id,
        is_recurring_instance: true,
        original_start_date: instanceStartDate.toISOString().split('T')[0],
        image_url: parentEvent.image_url,
        featured_image: parentEvent.featured_image,
        registration_required: parentEvent.registration_required,
        url: parentEvent.url,
      });

      count++;
    }

    // Safety: prevent infinite loops
    if (count === 0 && shouldInclude) count++;
    if (instances.length >= maxInstances) break;
  }

  return instances;
}

/**
 * Format recurrence rule as human-readable text
 */
export function formatRecurrenceRule(rule: RecurrenceRule): string {
  const parts: string[] = [];

  // Frequency and interval
  if (rule.interval === 1) {
    parts.push(rule.frequency);
  } else {
    parts.push(`every ${rule.interval} ${rule.frequency === 'daily' ? 'days' : rule.frequency === 'weekly' ? 'weeks' : rule.frequency === 'monthly' ? 'months' : 'years'}`);
  }

  // Days of week (for weekly)
  if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const days = rule.daysOfWeek.map(d => dayNames[d]).join(', ');
    parts.push(`on ${days}`);
  }

  // Monthly pattern
  if (rule.frequency === 'monthly') {
    if (rule.monthlyType === 'dayOfMonth' && rule.dayOfMonth) {
      parts.push(`on day ${rule.dayOfMonth}`);
    } else if (rule.monthlyType === 'dayOfWeek') {
      const weekNames = ['', 'first', 'second', 'third', 'fourth'];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const week = rule.weekOfMonth === -1 ? 'last' : weekNames[rule.weekOfMonth || 1];
      const day = rule.daysOfWeek ? dayNames[rule.daysOfWeek[0]] : '';
      parts.push(`on ${week} ${day}`);
    }
  }

  // End condition
  if (rule.endDate) {
    parts.push(`until ${new Date(rule.endDate).toLocaleDateString()}`);
  } else if (rule.endAfterOccurrences) {
    parts.push(`for ${rule.endAfterOccurrences} occurrences`);
  }

  return parts.join(' ');
}
