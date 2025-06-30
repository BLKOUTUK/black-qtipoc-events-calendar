import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { FilterOptions } from '../types';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onScrapeEvents: () => void;
  isScrapingEvents: boolean;
  showScrapeButton?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onScrapeEvents,
  isScrapingEvents,
  showScrapeButton = false
}) => {
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Date Range */}
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Source Filter */}
          <select
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Sources</option>
            <option value="eventbrite">Eventbrite</option>
            <option value="community">Community</option>
            <option value="outsavvy">Outsavvy</option>
            <option value="facebook">Facebook</option>
          </select>

          {/* Location Filter */}
          <input
            type="text"
            placeholder="Filter by location..."
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Scrape Events Button - Only show for authenticated users */}
        {showScrapeButton && (
          <button
            onClick={onScrapeEvents}
            disabled={isScrapingEvents}
            className={`flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 ${
              isScrapingEvents ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isScrapingEvents ? 'animate-spin' : ''}`} />
            {isScrapingEvents ? 'Discovering...' : 'Discover Events'}
          </button>
        )}
      </div>
    </div>
  );
};