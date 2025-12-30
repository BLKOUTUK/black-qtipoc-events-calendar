// Supabase Client Configuration for BLKOUTNXT Platform
// Handles authentication and database connections

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using demo mode')
  console.warn('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for full functionality')
  // Fallback for demo deployment
}

// Create Supabase client with fallback for demo mode
export const supabase = createClient<Database>(
  supabaseUrl || 'https://demo.supabase.co', 
  supabaseAnonKey || 'demo-key', 
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper functions for common operations with community-owned values
export const supabaseHelpers = {
  // Authentication helpers
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Database helpers with error handling
  async safeQuery<T>(queryFn: () => Promise<{ data: T | null, error: any }>) {
    try {
      const result = await queryFn()
      if (result.error) {
        console.error('Supabase query error:', result.error)
        return { data: null, error: result.error }
      }
      return result
    } catch (error) {
      console.error('Unexpected error in Supabase query:', error)
      return { data: null, error }
    }
  },

  // Check connection status
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .limit(1)
      
      return { connected: !error, error }
    } catch (error) {
      return { connected: false, error }
    }
  },

  // Enhanced Events API
  async getEvents(filters: {
    status?: string
    category?: string
    location?: string
    limit?: number
    offset?: number
  } = {}) {
    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.category) {
      query = query.ilike('tags', `%${filters.category}%`)
    }
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    return this.safeQuery(() => query)
  },

  async createEvent(eventData: any) {
    return this.safeQuery(() => 
      supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()
    )
  },

  async updateEvent(id: string, updates: any) {
    return this.safeQuery(() =>
      supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    )
  },

  async deleteEvent(id: string) {
    return this.safeQuery(() =>
      supabase
        .from('events')
        .delete()
        .eq('id', id)
    )
  },

  // Enhanced Articles API
  async getArticles(filters: {
    status?: string
    category?: string
    featured?: boolean
    limit?: number
    offset?: number
  } = {}) {
    // Query both news_articles and published_articles to get all content
    const [newsroomResults, publishedResults] = await Promise.all([
      // Original newsroom articles
      this.safeQuery(() => {
        let query = supabase
          .from('news_articles')
          .select('*')
          .order('published_at', { ascending: false })

        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        
        if (filters.category) {
          query = query.eq('category', filters.category)
        }
        
        if (filters.featured !== undefined) {
          query = query.eq('featured', filters.featured)
        }

        return query
      }),
      
      // Published articles from moderation queue
      this.safeQuery(() => {
        let query = supabase
          .from('published_articles')
          .select('*')
          .order('published_at', { ascending: false })

        // Only get published status from published_articles
        if (filters.status && filters.status !== 'published') {
          // If looking for non-published status, skip this table
          return Promise.resolve({ data: [], error: null })
        }

        return query
      })
    ])

    // Combine results from both tables
    const combinedData = [
      ...(newsroomResults.data || []),
      ...(publishedResults.data || [])
    ]

    // Sort combined results by published_at
    combinedData.sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )

    // Apply limit and offset to combined results
    let finalData = combinedData
    if (filters.offset || filters.limit) {
      const offset = filters.offset || 0
      const limit = filters.limit || 20
      finalData = combinedData.slice(offset, offset + limit)
    } else if (filters.limit) {
      finalData = combinedData.slice(0, filters.limit)
    }

    return {
      data: finalData,
      error: newsroomResults.error || publishedResults.error
    }
  },

  async createArticle(articleData: any) {
    return this.safeQuery(() =>
      supabase
        .from('news_articles')
        .insert(articleData)
        .select()
        .single()
    )
  },

  async updateArticle(id: string, updates: any) {
    return this.safeQuery(() =>
      supabase
        .from('news_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    )
  },

  async deleteArticle(id: string) {
    return this.safeQuery(() =>
      supabase
        .from('news_articles')
        .delete()
        .eq('id', id)
    )
  },

  // Contact management for community building
  async getContacts(filters: { verified?: boolean, limit?: number } = {}) {
    let query = supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.verified !== undefined) {
      query = query.eq('verified', filters.verified)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    return this.safeQuery(() => query)
  },

  async createContact(contactData: any) {
    return this.safeQuery(() =>
      supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single()
    )
  },

  // Real-time subscription helpers with community focus
  subscribeToEvents(callback: (payload: any) => void) {
    return supabase
      .channel('events-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, (payload) => {
        console.log('🔴 Event change detected:', payload)
        callback(payload)
      })
      .subscribe()
  },

  subscribeToArticles(callback: (payload: any) => void) {
    return supabase
      .channel('articles-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'news_articles'
      }, (payload) => {
        console.log('📰 Article change detected:', payload)
        callback(payload)
      })
      .subscribe()
  },

  // Community statistics for transparency
  async getCommunityStats() {
    const [eventsResult, articlesResult, contactsResult] = await Promise.all([
      this.safeQuery(() => 
        supabase
          .from('events')
          .select('status, event_date')
      ),
      this.safeQuery(() =>
        supabase
          .from('news_articles')
          .select('status, category')
      ),
      this.safeQuery(() =>
        supabase
          .from('contacts')
          .select('verified')
      )
    ])

    const today = new Date().toISOString().split('T')[0]
    
    return {
      events: {
        total: eventsResult.data?.length || 0,
        published: eventsResult.data?.filter(e => e.status === 'published').length || 0,
        upcoming: eventsResult.data?.filter(e => e.status === 'published' && e.event_date >= today).length || 0
      },
      articles: {
        total: articlesResult.data?.length || 0,
        published: articlesResult.data?.filter(a => a.status === 'published').length || 0,
        byCategory: articlesResult.data?.reduce((acc, article) => {
          acc[article.category] = (acc[article.category] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      },
      community: {
        totalContacts: contactsResult.data?.length || 0,
        verifiedContacts: contactsResult.data?.filter(c => c.verified).length || 0
      }
    }
  },

  // File upload for community media
  async uploadFile(file: File, bucket: 'articles' | 'events' | 'profiles' | 'governance' = 'articles') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${bucket}/${fileName}`

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file)

    if (error) {
      return { data: null, error }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    return { data: { path: filePath, url: publicUrl }, error: null }
  },

  // Governance Proposals API
  async getGovernanceProposals(filters: {
    status?: string
    category?: string
    limit?: number
    offset?: number
  } = {}) {
    let query = supabase
      .from('governance_proposals_with_votes')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    return this.safeQuery(() => query)
  },

  async createGovernanceProposal(proposalData: any) {
    // Get current user
    const { user } = await this.getCurrentUser()
    if (!user) {
      return { data: null, error: { message: 'User must be authenticated to create proposals' } }
    }

    const proposalWithUser = {
      ...proposalData,
      proposer_id: user.id
    }

    return this.safeQuery(() => 
      supabase
        .from('governance_proposals')
        .insert(proposalWithUser)
        .select()
        .single()
    )
  },

  async updateGovernanceProposal(id: string, updates: any) {
    return this.safeQuery(() =>
      supabase
        .from('governance_proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    )
  },

  async voteOnProposal(proposalId: string, vote: 'for' | 'against' | 'abstain', comment?: string) {
    // Get current user
    const { user } = await this.getCurrentUser()
    if (!user) {
      return { data: null, error: { message: 'User must be authenticated to vote' } }
    }

    const voteData = {
      proposal_id: proposalId,
      voter_id: user.id,
      vote,
      comment
    }

    return this.safeQuery(() =>
      supabase
        .from('proposal_votes')
        .upsert(voteData, { onConflict: 'proposal_id,voter_id' })
        .select()
        .single()
    )
  },

  // Community Meetings API
  async getCommunityMeetings(filters: {
    type?: string
    status?: string
    limit?: number
    offset?: number
  } = {}) {
    let query = supabase
      .from('community_meetings')
      .select('*')
      .order('date', { ascending: false })

    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    return this.safeQuery(() => query)
  },

  async createCommunityMeeting(meetingData: any) {
    const { user } = await this.getCurrentUser()
    
    const meetingWithUser = {
      ...meetingData,
      created_by: user?.id
    }

    return this.safeQuery(() =>
      supabase
        .from('community_meetings')
        .insert(meetingWithUser)
        .select()
        .single()
    )
  },

  async updateCommunityMeeting(id: string, updates: any) {
    return this.safeQuery(() =>
      supabase
        .from('community_meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Governance Documents API
  async getGovernanceDocuments(filters: {
    type?: string
    status?: string
    meetingId?: string
    proposalId?: string
    limit?: number
    offset?: number
  } = {}) {
    let query = supabase
      .from('governance_documents')
      .select('*')
      .order('uploaded_date', { ascending: false })

    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.meetingId) {
      query = query.eq('meeting_id', filters.meetingId)
    }

    if (filters.proposalId) {
      query = query.eq('proposal_id', filters.proposalId)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    return this.safeQuery(() => query)
  },

  async uploadGovernanceDocument(documentData: any) {
    const { user } = await this.getCurrentUser()
    
    const documentWithUser = {
      ...documentData,
      uploaded_by: user?.id,
      uploaded_by_name: user?.user_metadata?.full_name || user?.email || 'Unknown User'
    }

    return this.safeQuery(() =>
      supabase
        .from('governance_documents')
        .insert(documentWithUser)
        .select()
        .single()
    )
  },

  async updateGovernanceDocument(id: string, updates: any) {
    return this.safeQuery(() =>
      supabase
        .from('governance_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    )
  },

  async deleteGovernanceDocument(id: string) {
    return this.safeQuery(() =>
      supabase
        .from('governance_documents')
        .delete()
        .eq('id', id)
    )
  },

  // Community Members API
  async getCommunityMembers(filters: {
    role?: string
    verified?: boolean
    limit?: number
    offset?: number
  } = {}) {
    let query = supabase
      .from('community_members')
      .select('*')
      .order('contribution_score', { ascending: false })

    if (filters.role) {
      query = query.eq('role', filters.role)
    }
    
    if (filters.verified !== undefined) {
      query = query.eq('verified', filters.verified)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    return this.safeQuery(() => query)
  },

  async updateCommunityMember(id: string, updates: any) {
    return this.safeQuery(() =>
      supabase
        .from('community_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Proposal Discussions API
  async getProposalDiscussions(proposalId: string) {
    return this.safeQuery(() =>
      supabase
        .from('proposal_discussions')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: true })
    )
  },

  async createProposalDiscussion(discussionData: any) {
    const { user } = await this.getCurrentUser()
    
    const discussionWithUser = {
      ...discussionData,
      user_id: user?.id,
      user_name: user?.user_metadata?.full_name || user?.email || 'Anonymous'
    }

    return this.safeQuery(() =>
      supabase
        .from('proposal_discussions')
        .insert(discussionWithUser)
        .select()
        .single()
    )
  },

  // Real-time subscription helpers for governance
  subscribeToProposals(callback: (payload: any) => void) {
    return supabase
      .channel('governance-proposals-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'governance_proposals'
      }, (payload) => {
        console.log('🏛️ Governance proposal change detected:', payload)
        callback(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'proposal_votes'
      }, (payload) => {
        console.log('🗳️ Proposal vote change detected:', payload)
        callback(payload)
      })
      .subscribe()
  },

  subscribeToMeetings(callback: (payload: any) => void) {
    return supabase
      .channel('community-meetings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_meetings'
      }, (payload) => {
        console.log('📅 Community meeting change detected:', payload)
        callback(payload)
      })
      .subscribe()
  },

  subscribeToDocuments(callback: (payload: any) => void) {
    return supabase
      .channel('governance-documents-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'governance_documents'
      }, (payload) => {
        console.log('📄 Governance document change detected:', payload)
        callback(payload)
      })
      .subscribe()
  },

  subscribeToDiscussions(proposalId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`proposal-discussions-${proposalId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'proposal_discussions',
        filter: `proposal_id=eq.${proposalId}`
      }, (payload) => {
        console.log('💬 Proposal discussion change detected:', payload)
        callback(payload)
      })
      .subscribe()
  },

  // Governance statistics for transparency dashboard
  async getGovernanceStats() {
    const [proposalStats, memberStats, meetingStats, documentStats] = await Promise.all([
      this.safeQuery(() => supabase.rpc('calculate_proposal_stats')),
      this.safeQuery(() => 
        supabase
          .from('community_members')
          .select('role, verified, contribution_score')
      ),
      this.safeQuery(() =>
        supabase
          .from('community_meetings')
          .select('status, type, date')
      ),
      this.safeQuery(() =>
        supabase
          .from('governance_documents')
          .select('type, status, is_public')
      )
    ])

    const today = new Date().toISOString().split('T')[0]
    
    return {
      proposals: proposalStats.data?.[0] || {
        total_proposals: 0,
        active_proposals: 0,
        approved_proposals: 0,
        average_participation: 0,
        total_eligible_voters: 0
      },
      members: {
        total: memberStats.data?.length || 0,
        verified: memberStats.data?.filter(m => m.verified).length || 0,
        byRole: memberStats.data?.reduce((acc, member) => {
          acc[member.role] = (acc[member.role] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {},
        averageContribution: memberStats.data?.reduce((sum, m) => sum + (m.contribution_score || 0), 0) / (memberStats.data?.length || 1) || 0
      },
      meetings: {
        total: meetingStats.data?.length || 0,
        completed: meetingStats.data?.filter(m => m.status === 'completed').length || 0,
        upcoming: meetingStats.data?.filter(m => m.status === 'scheduled' && m.date >= today).length || 0,
        byType: meetingStats.data?.reduce((acc, meeting) => {
          acc[meeting.type] = (acc[meeting.type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      },
      documents: {
        total: documentStats.data?.length || 0,
        published: documentStats.data?.filter(d => d.status === 'published').length || 0,
        public: documentStats.data?.filter(d => d.is_public).length || 0,
        byType: documentStats.data?.reduce((acc, doc) => {
          acc[doc.type] = (acc[doc.type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      }
    }
  }
}

export default supabase
