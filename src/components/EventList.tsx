import React from 'react';
import { Event } from '../types';
import { EventCard } from './EventCard';
import { groupEventsByWeek } from '../utils/dateUtils';
import { sanitizeEvents } from '../utils/eventUtils';

interface EventListProps {
  events: Event[];
  loading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  showDeleteOnly?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string, edits: Partial<Event>) => void;
  onDelete?: (id: string) => void;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  loading = false,
  emptyMessage = "No events found matching your criteria.",
  showActions = false,
  showDeleteOnly = false,
  onApprove,
  onReject,
  onEdit,
  onDelete
}) => {
  const sanitizedEvents = sanitizeEvents(events);

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, weekIndex) => (
          <div key={weekIndex} className="space-y-4">
            {/* Week header skeleton — dark-mode-safe (was bg-gray-200 on dark = wrong) */}
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 w-1/3 mb-2"></div>
              <div className="h-4 bg-white/5 w-1/5"></div>
            </div>

            {/* Event cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(2)].map((_, cardIndex) => (
                <div key={cardIndex} className="bg-liberation-black-power/80 border border-events/30 shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-white/5"></div>
                  <div className="p-6">
                    <div className="h-6 bg-white/10 mb-3"></div>
                    <div className="h-4 bg-white/5 mb-2"></div>
                    <div className="h-4 bg-white/5 w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/5 w-2/3"></div>
                      <div className="h-4 bg-white/5 w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sanitizedEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-events/40 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-signature font-black text-xl uppercase tracking-tight text-white mb-2">No Liberation Events Found</h3>
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  // Group events by week starting from September 28th, 2025
  const weeklyEvents = groupEventsByWeek(sanitizedEvents, new Date('2025-09-28'));
  const weekNumbers = Object.keys(weeklyEvents).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-12">
      {weekNumbers.map(weekNumber => {
        const week = weeklyEvents[weekNumber];
        const isCurrentWeek = week.title.includes('This Week');

        return (
          <div key={weekNumber} className="space-y-6">
            {/* Week Header — Round 2 lemon section accent. Current week pops to lemon, others
                hold a quieter gold-divine. Gradients deprecated per One Platform Design. */}
            <div className={`border-l-4 pl-6 py-4 ${
              isCurrentWeek
                ? 'border-events bg-events/5'
                : 'border-liberation-gold-divine/40'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`font-signature font-black text-2xl uppercase tracking-tight ${
                    isCurrentWeek ? 'text-events' : 'text-white'
                  }`}>
                    {week.title}
                  </h2>
                  <p className="text-sm text-gray-300 mt-1 font-disrupt italic">
                    {week.events.length} liberation event{week.events.length !== 1 ? 's' : ''} this week
                  </p>
                </div>

                {isCurrentWeek && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-events rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold uppercase tracking-wider text-events">Happening Now</span>
                  </div>
                )}
              </div>
            </div>

            {/* Events Grid for this week */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-6">
              {week.events.filter(event => event && event.id).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showActions={showActions}
                  showDeleteOnly={showDeleteOnly}
                  onApprove={onApprove}
                  onReject={onReject}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>

            {/* Week Separator — solid lemon strokes, sharp dots (gradients deprecated) */}
            {weekNumber !== weekNumbers[weekNumbers.length - 1] && (
              <div className="flex items-center justify-center py-8">
                <div className="flex-1 h-px bg-events/30"></div>
                <div className="mx-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-events/60"></div>
                  <div className="w-1 h-1 bg-events/40"></div>
                  <div className="w-2 h-2 bg-events/60"></div>
                </div>
                <div className="flex-1 h-px bg-events/30"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};