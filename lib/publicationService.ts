// Copy of publication service implementation for API usage
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ModeratedContent {
  id: string;
  content_id?: string;
  title: string;
  content: string;
  author?: string;
  type: string;
  source: string;
  approved_by?: string;
}

interface PublishedContent {
  id: string;
  title: string;
  content: string;
  author?: string;
  published_at: string;
  approved_by?: string;
  status: 'published' | 'draft' | 'archived';
  source: string;
  original_moderation_id?: string;
}

export class CommunityPublicationService {
  
  async approveFromModeration(contentId: string, approverId: string): Promise<PublishedContent> {
    try {
      // 1. Get content from moderation queue
      const { data: moderatedContent, error: fetchError } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('id', contentId)
        .single();
      
      if (fetchError || !moderatedContent) {
        throw new Error(`Content not found in moderation: ${fetchError?.message || 'Unknown error'}`);
      }

      // 2. Update moderation status to approved
      const { error: updateError } = await supabase
        .from('moderation_queue')
        .update({ 
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (updateError) {
        throw new Error(`Failed to update moderation status: ${updateError.message}`);
      }

      // 3. Publish the content
      const published = await this.publishContent(moderatedContent);

      // 4. Archive from moderation queue after successful publication
      await this.removeFromModerationQueue(contentId);

      return published;

    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    }
  }

  async rejectFromModeration(contentId: string, moderatorId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('moderation_queue')
        .update({ 
          status: 'rejected',
          rejected_by: moderatorId,
          rejection_reason: reason,
          rejected_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) {
        throw new Error(`Failed to reject content: ${error.message}`);
      }

    } catch (error) {
      console.error('Rejection failed:', error);
      throw error;
    }
  }

  async publishContent(content: ModeratedContent): Promise<PublishedContent> {
    try {
      // Determine target publication table based on content type
      const targetTable = this.getPublicationTable(content.type);
      
      const publishedContent = {
        id: content.content_id || content.id,
        title: content.title,
        content: content.content,
        author: content.author,
        published_at: new Date().toISOString(),
        status: 'published' as const,
        source: content.source,
        approved_by: content.approved_by,
        original_moderation_id: content.id
      };

      // Insert into appropriate published content table
      const { data: published, error } = await supabase
        .from(targetTable)
        .insert(publishedContent)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to publish content to ${targetTable}: ${error.message}`);
      }

      return published;

    } catch (error) {
      console.error('Publication failed:', error);
      throw error;
    }
  }

  private getPublicationTable(contentType: string): string {
    switch (contentType) {
      case 'news_digest':
      case 'automated_digest':
        return 'published_news';
      case 'community_event':
      case 'discovered_event':
        return 'published_events';
      case 'chrome_extension_content':
      case 'shared_article':
        return 'published_articles';
      default:
        return 'published_articles'; // Default fallback
    }
  }

  private async removeFromModerationQueue(contentId: string): Promise<void> {
    try {
      // Archive rather than delete for audit trail
      const { error } = await supabase
        .from('moderation_queue')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) {
        console.error('Failed to archive moderation item:', error);
        // Don't throw - publication was successful, archiving is secondary
      }
    } catch (error) {
      console.error('Archive operation failed:', error);
    }
  }
}