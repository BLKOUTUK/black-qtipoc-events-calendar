import React, { useState } from 'react';
import { RecurrenceRule } from '../types';
import { Calendar, Repeat, X } from 'lucide-react';

interface RecurringEventFormProps {
  initialRule?: RecurrenceRule;
  onSave: (rule: RecurrenceRule | null) => void;
  onCancel: () => void;
}

export const RecurringEventForm: React.FC<RecurringEventFormProps> = ({
  initialRule,
  onSave,
  onCancel
}) => {
  const [rule, setRule] = useState<RecurrenceRule>(initialRule || {
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
  });

  const [endType, setEndType] = useState<'never' | 'date' | 'count'>(
    initialRule?.endDate ? 'date' : initialRule?.endAfterOccurrences ? 'count' : 'never'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalRule: RecurrenceRule = {
      frequency: rule.frequency,
      interval: rule.interval,
    };

    // Add frequency-specific fields
    if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      finalRule.daysOfWeek = rule.daysOfWeek;
    }

    if (rule.frequency === 'monthly') {
      finalRule.monthlyType = rule.monthlyType || 'dayOfMonth';
      if (rule.monthlyType === 'dayOfMonth') {
        finalRule.dayOfMonth = rule.dayOfMonth;
      } else {
        finalRule.weekOfMonth = rule.weekOfMonth;
        finalRule.daysOfWeek = rule.daysOfWeek;
      }
    }

    // Add end condition
    if (endType === 'date' && rule.endDate) {
      finalRule.endDate = rule.endDate;
    } else if (endType === 'count' && rule.endAfterOccurrences) {
      finalRule.endAfterOccurrences = rule.endAfterOccurrences;
    }

    onSave(finalRule);
  };

  const toggleDayOfWeek = (day: number) => {
    const current = rule.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    setRule({ ...rule, daysOfWeek: updated });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Repeat className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recurring Event Settings</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Frequency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repeat Pattern
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
              <button
                key={freq}
                type="button"
                onClick={() => setRule({ ...rule, frequency: freq })}
                className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                  rule.frequency === freq
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repeat Every
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="1"
              max="30"
              value={rule.interval}
              onChange={(e) => setRule({ ...rule, interval: parseInt(e.target.value) })}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md"
            />
            <span className="text-gray-700">
              {rule.frequency === 'daily' && `day${rule.interval > 1 ? 's' : ''}`}
              {rule.frequency === 'weekly' && `week${rule.interval > 1 ? 's' : ''}`}
              {rule.frequency === 'monthly' && `month${rule.interval > 1 ? 's' : ''}`}
              {rule.frequency === 'yearly' && `year${rule.interval > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Days of Week (for weekly) */}
        {rule.frequency === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repeat On
            </label>
            <div className="flex gap-2">
              {dayNames.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDayOfWeek(index)}
                  className={`w-12 h-12 rounded-full border-2 transition-colors ${
                    rule.daysOfWeek?.includes(index)
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Options */}
        {rule.frequency === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Pattern
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={rule.monthlyType === 'dayOfMonth'}
                  onChange={() => setRule({ ...rule, monthlyType: 'dayOfMonth' })}
                  className="mr-2"
                />
                <span className="text-gray-700">Day of month:</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={rule.dayOfMonth || 1}
                  onChange={(e) => setRule({ ...rule, dayOfMonth: parseInt(e.target.value) })}
                  disabled={rule.monthlyType !== 'dayOfMonth'}
                  className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={rule.monthlyType === 'dayOfWeek'}
                  onChange={() => setRule({ ...rule, monthlyType: 'dayOfWeek' })}
                  className="mr-2"
                />
                <span className="text-gray-700">Specific day:</span>
                <select
                  value={rule.weekOfMonth || 1}
                  onChange={(e) => setRule({ ...rule, weekOfMonth: parseInt(e.target.value) })}
                  disabled={rule.monthlyType !== 'dayOfWeek'}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value={1}>First</option>
                  <option value={2}>Second</option>
                  <option value={3}>Third</option>
                  <option value={4}>Fourth</option>
                  <option value={-1}>Last</option>
                </select>
                <select
                  value={(rule.daysOfWeek && rule.daysOfWeek[0]) || 0}
                  onChange={(e) => setRule({ ...rule, daysOfWeek: [parseInt(e.target.value)] })}
                  disabled={rule.monthlyType !== 'dayOfWeek'}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {/* End Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ends
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                checked={endType === 'never'}
                onChange={() => setEndType('never')}
                className="mr-2"
              />
              <span className="text-gray-700">Never</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={endType === 'date'}
                onChange={() => setEndType('date')}
                className="mr-2"
              />
              <span className="text-gray-700">On date:</span>
              <input
                type="date"
                value={rule.endDate || ''}
                onChange={(e) => setRule({ ...rule, endDate: e.target.value })}
                disabled={endType !== 'date'}
                className="ml-2 px-2 py-1 border border-gray-300 rounded-md disabled:bg-gray-100"
              />
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={endType === 'count'}
                onChange={() => setEndType('count')}
                className="mr-2"
              />
              <span className="text-gray-700">After:</span>
              <input
                type="number"
                min="1"
                max="365"
                value={rule.endAfterOccurrences || 10}
                onChange={(e) => setRule({ ...rule, endAfterOccurrences: parseInt(e.target.value) })}
                disabled={endType !== 'count'}
                className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded-md disabled:bg-gray-100"
              />
              <span className="ml-2 text-gray-700">occurrences</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => onSave(null)}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Remove Recurrence
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Save Recurrence
          </button>
        </div>
      </form>
    </div>
  );
};
