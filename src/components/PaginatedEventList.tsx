import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Event, FeaturedContent } from '../types';
import { EventCard } from './EventCard';
import { FeaturedImageCard } from './FeaturedImageCard';
import { groupEventsByWeek } from '../utils/dateUtils';
import { featuredContentService } from '../services/featuredContentService';

interface PaginatedEventListProps {
  events: Event[];
  loading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  itemsPerPage?: number;
}

export const PaginatedEventList: React.FC<PaginatedEventListProps> = ({
  events,
  loading = false,
  emptyMessage = "No events found matching your criteria.",
  showActions = false,
  onApprove,
  onReject,
  itemsPerPage = 12
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);

  useEffect(() => {
    loadFeaturedContent();
  }, []);

  const loadFeaturedContent = async () => {
    const content = await featuredContentService.getCurrentWeekFeatured();
    setFeaturedContent(content);
  };

  // Group events by week and flatten for pagination
  const { paginatedEvents, totalPages } = useMemo(() => {
    if (events.length === 0) {
      return { paginatedEvents: [], totalPages: 0 };
    }

    // Group events by week - using September 30, 2025 as the start date
    const weeklyEvents = groupEventsByWeek(events, new Date('2025-09-30'));
    const weekNumbers = Object.keys(weeklyEvents).map(Number).sort((a, b) => a - b);

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const eventsSlice = events.slice(startIndex, endIndex);

    // Re-group the paginated slice by weeks for display
    const paginatedWeeklyEvents = groupEventsByWeek(eventsSlice, new Date('2025-09-30'));
    const paginatedWeekNumbers = Object.keys(paginatedWeeklyEvents).map(Number).sort((a, b) => a - b);

    return {
      paginatedEvents: paginatedWeekNumbers.map(weekNumber => ({
        weekNumber,
        ...paginatedWeeklyEvents[weekNumber]
      })),
      totalPages: Math.ceil(events.length / itemsPerPage)
    };
  }, [events, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of events section
    const eventsContainer = document.getElementById('events-container');
    if (eventsContainer) {
      eventsContainer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderPaginationButton = (page: number, isActive: boolean = false, disabled: boolean = false) => (
    <button
      key={page}
      onClick={() => handlePageChange(page)}
      disabled={disabled}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-yellow-500 text-black'
          : disabled
          ? 'text-gray-500 cursor-not-allowed'
          : 'text-white hover:text-yellow-500 hover:bg-yellow-500/10'
      }`}
    >
      {page}
    </button>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(renderPaginationButton(i, i === currentPage));
      }
    } else {
      // Show with ellipsis
      pages.push(renderPaginationButton(1, 1 === currentPage));

      if (currentPage > 3) {
        pages.push(
          <span key="ellipsis-start" className="px-2 py-2 text-gray-500">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        );
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(renderPaginationButton(i, i === currentPage));
      }

      if (currentPage < totalPages - 2) {
        pages.push(
          <span key="ellipsis-end" className="px-2 py-2 text-gray-500">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        );
      }

      if (totalPages > 1) {
        pages.push(renderPaginationButton(totalPages, totalPages === currentPage));
      }
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-12">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === 1
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-white hover:text-yellow-500 hover:bg-yellow-500/10'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {pages}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === totalPages
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-white hover:text-yellow-500 hover:bg-yellow-500/10'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div id="events-container" className="space-y-8">
        {[...Array(3)].map((_, weekIndex) => (
          <div key={weekIndex} className="space-y-4">
            {/* Week header skeleton */}
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
            </div>

            {/* Event cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(2)].map((_, cardIndex) => (
                <div key={cardIndex} className="bg-gray-800 border border-yellow-500/30 rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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

  if (events.length === 0) {
    return (
      <div id="events-container" className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-liberation-sovereignty-gold mb-2">No Events Found</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div id="events-container">
      {/* Page Info */}
      <div className="flex justify-between items-center mb-8 bg-gray-800/50 rounded-lg p-4">
        <div className="text-white text-sm font-medium">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, events.length)} of {events.length} events
        </div>
        <div className="text-yellow-500 text-sm font-bold">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Events by Week */}
      <div className="space-y-12">
        {paginatedEvents.map(({ weekNumber, events: weekEvents, title, range }) => {
          const isCurrentWeek = title.includes('This Week');

          return (
            <div key={weekNumber} className="space-y-6">
              {/* Week Header */}
              <div className={`border-l-4 pl-6 py-4 ${
                isCurrentWeek
                  ? 'border-blkout-primary bg-gradient-to-r from-blkout-primary/5 to-transparent'
                  : 'border-blkout-accent/50 bg-gradient-to-r from-blkout-accent/5 to-transparent'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-bold ${
                      isCurrentWeek ? 'text-blkout-primary' : 'text-white'
                    }`}>
                      {title}
                    </h2>
                    <p className="text-sm text-gray-300 mt-1">
                      {weekEvents.length} event{weekEvents.length !== 1 ? 's' : ''} this week
                    </p>
                  </div>

                  {isCurrentWeek && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blkout-primary rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-blkout-primary">Happening Now</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Events Grid for this week */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-6">
                {featuredContentService.interleaveWithEvents(weekEvents, featuredContent, 6).map((item, index) => {
                  if ('image_url' in item) {
                    // It's a FeaturedContent item
                    return (
                      <FeaturedImageCard
                        key={`featured-${item.id}`}
                        title={item.title}
                        caption={item.caption}
                        imageUrl={item.image_url}
                        linkUrl={item.link_url}
                      />
                    );
                  } else {
                    // It's an Event item
                    return (
                      <EventCard
                        key={item.id}
                        event={item}
                        showActions={showActions}
                        onApprove={onApprove}
                        onReject={onReject}
                      />
                    );
                  }
                })}
              </div>

              {/* Week Separator */}
              {weekNumber !== paginatedEvents[paginatedEvents.length - 1].weekNumber && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blkout-accent/30 to-transparent"></div>
                  <div className="mx-4 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blkout-accent/50 rounded-full"></div>
                    <div className="w-1 h-1 bg-blkout-accent/30 rounded-full"></div>
                    <div className="w-2 h-2 bg-blkout-accent/50 rounded-full"></div>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blkout-accent/30 to-transparent"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};