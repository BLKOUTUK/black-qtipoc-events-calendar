import { supabase } from '../lib/supabase';
import { FeaturedContent } from '../types';

export const featuredContentService = {
  /**
   * Get active featured content for the current week
   */
  async getCurrentWeekFeatured(): Promise<FeaturedContent[]> {
    try {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      const weekStart = monday.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('weekly_featured_content')
        .select('*')
        .eq('status', 'active')
        .eq('week_start', weekStart)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching featured content:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCurrentWeekFeatured:', error);
      return [];
    }
  },

  /**
   * Interleave featured content among events
   * @param events - Array of events
   * @param featuredContent - Array of featured content
   * @param spacing - How many events between each featured item
   */
  interleaveWithEvents<T>(events: T[], featuredContent: FeaturedContent[], spacing: number = 6): (T | FeaturedContent)[] {
    const result: (T | FeaturedContent)[] = [];
    let featuredIndex = 0;

    events.forEach((event, index) => {
      result.push(event);

      // Insert featured content after every 'spacing' events
      if ((index + 1) % spacing === 0 && featuredIndex < featuredContent.length) {
        result.push(featuredContent[featuredIndex]);
        featuredIndex++;
      }
    });

    return result;
  }
};
