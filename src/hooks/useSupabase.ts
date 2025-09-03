// Custom React hooks for Supabase integration with BLKOUTNXT community values

import { useState, useEffect, useCallback } from 'react'
import { supabaseHelpers, supabase } from '../lib/supabase'
import type { Event, NewsArticle, Contact } from '../types/supabase'

// Hook for managing events with real-time updates
export const useEvents = (filters: {
  status?: string
  category?: string
  location?: string
  limit?: number
} = {}) => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await supabaseHelpers.getEvents(filters)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch events')
      }
      
      setEvents(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)]) // Serialize filters to avoid object reference issues

  useEffect(() => {
    fetchEvents()

    // Set up real-time subscription with stable callback
    const subscription = supabaseHelpers.subscribeToEvents(() => {
      // Use the current fetchEvents function directly
      fetchEvents()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchEvents])

  const createEvent = async (eventData: Partial<Event>) => {
    try {
      const result = await supabaseHelpers.createEvent(eventData)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create event')
      }
      await fetchEvents() // Refresh list
      return result.data
    } catch (err) {
      throw err
    }
  }

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const result = await supabaseHelpers.updateEvent(id, updates)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update event')
      }
      await fetchEvents() // Refresh list
      return result.data
    } catch (err) {
      throw err
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const result = await supabaseHelpers.deleteEvent(id)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete event')
      }
      await fetchEvents() // Refresh list
    } catch (err) {
      throw err
    }
  }

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent
  }
}

// Hook for managing articles with real-time updates
export const useArticles = (filters: {
  status?: string
  category?: string
  featured?: boolean
  limit?: number
} = {}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await supabaseHelpers.getArticles(filters)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch articles')
      }
      
      setArticles(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchArticles()

    // Set up real-time subscription
    const subscription = supabaseHelpers.subscribeToArticles(() => {
      fetchArticles()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchArticles])

  const createArticle = async (articleData: Partial<NewsArticle>) => {
    try {
      const result = await supabaseHelpers.createArticle(articleData)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create article')
      }
      await fetchArticles() // Refresh list
      return result.data
    } catch (err) {
      throw err
    }
  }

  const updateArticle = async (id: string, updates: Partial<NewsArticle>) => {
    try {
      const result = await supabaseHelpers.updateArticle(id, updates)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update article')
      }
      await fetchArticles() // Refresh list
      return result.data
    } catch (err) {
      throw err
    }
  }

  const deleteArticle = async (id: string) => {
    try {
      const result = await supabaseHelpers.deleteArticle(id)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete article')
      }
      await fetchArticles() // Refresh list
    } catch (err) {
      throw err
    }
  }

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles,
    createArticle,
    updateArticle,
    deleteArticle
  }
}

// Hook for community statistics and transparency
export const useCommunityStats = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await supabaseHelpers.getCommunityStats()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch community stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// Hook for file uploads with community media guidelines
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (
    file: File, 
    bucket: 'articles' | 'events' | 'profiles' = 'articles'
  ) => {
    try {
      setUploading(true)
      setError(null)
      
      // Check file size (max 5MB for community accessibility)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File too large. Please keep under 5MB for community accessibility.')
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, WebP, and GIF images are supported.')
      }

      const result = await supabaseHelpers.uploadFile(file, bucket)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to upload file')
      }

      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      throw err
    } finally {
      setUploading(false)
    }
  }

  return {
    uploadFile,
    uploading,
    error
  }
}

// Hook for authentication with community context
export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial user
    supabaseHelpers.getCurrentUser().then(({ user, error }) => {
      setUser(user)
      setError(error?.message || null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        if (event === 'SIGNED_OUT') {
          setError(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const result = await supabaseHelpers.signIn(email, password)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to sign in')
      }
      
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const result = await supabaseHelpers.signOut()
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to sign out')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user
  }
}

// Hook for real-time community activity feed
export const useCommunityActivity = () => {
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
    
    // Subscribe to both events and articles changes
    const eventsSubscription = supabaseHelpers.subscribeToEvents((payload) => {
      const activityItem = {
        id: `event-${payload.new?.id || payload.old?.id}-${Date.now()}`,
        type: 'event',
        action: payload.eventType,
        data: payload.new || payload.old,
        timestamp: new Date().toISOString()
      }
      
      setActivity(prev => [activityItem, ...prev.slice(0, 49)]) // Keep last 50 items
    })

    const articlesSubscription = supabaseHelpers.subscribeToArticles((payload) => {
      const activityItem = {
        id: `article-${payload.new?.id || payload.old?.id}-${Date.now()}`,
        type: 'article',
        action: payload.eventType,
        data: payload.new || payload.old,
        timestamp: new Date().toISOString()
      }
      
      setActivity(prev => [activityItem, ...prev.slice(0, 49)]) // Keep last 50 items
    })

    return () => {
      eventsSubscription.unsubscribe()
      articlesSubscription.unsubscribe()
    }
  }, [])

  return {
    activity,
    loading
  }
}

// Hook for governance proposals with real-time updates
export const useGovernanceProposals = (filters: {
  status?: string
  category?: string
  limit?: number
} = {}) => {
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await supabaseHelpers.getGovernanceProposals(filters)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch proposals')
      }
      
      setProposals(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProposals()

    // Set up real-time subscription
    const subscription = supabaseHelpers.subscribeToProposals(() => {
      fetchProposals()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProposals])

  const createProposal = async (proposalData: any) => {
    try {
      const result = await supabaseHelpers.createGovernanceProposal(proposalData)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create proposal')
      }
      await fetchProposals() // Refresh list
      return result.data
    } catch (err) {
      throw err
    }
  }

  const voteOnProposal = async (proposalId: string, vote: 'for' | 'against' | 'abstain', comment?: string) => {
    try {
      const result = await supabaseHelpers.voteOnProposal(proposalId, vote, comment)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to vote on proposal')
      }
      await fetchProposals() // Refresh list
      return result.data
    } catch (err) {
      throw err
    }
  }

  return {
    proposals,
    loading,
    error,
    refetch: fetchProposals,
    createProposal,
    voteOnProposal
  }
}

// Hook for community meetings
export const useCommunityMeetings = (filters: {
  type?: string
  status?: string
  limit?: number
} = {}) => {
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await supabaseHelpers.getCommunityMeetings(filters)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch meetings')
      }
      
      setMeetings(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchMeetings()

    // Set up real-time subscription
    const subscription = supabaseHelpers.subscribeToMeetings(() => {
      fetchMeetings()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchMeetings])

  return {
    meetings,
    loading,
    error,
    refetch: fetchMeetings
  }
}

// Hook for governance documents
export const useGovernanceDocuments = (filters: {
  type?: string
  status?: string
  meetingId?: string
  limit?: number
} = {}) => {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await supabaseHelpers.getGovernanceDocuments(filters)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch documents')
      }
      
      setDocuments(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchDocuments()

    // Set up real-time subscription
    const subscription = supabaseHelpers.subscribeToDocuments(() => {
      fetchDocuments()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchDocuments])

  const uploadDocument = async (documentData: any) => {
    try {
      const result = await supabaseHelpers.uploadGovernanceDocument(documentData)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to upload document')
      }
      await fetchDocuments() // Refresh list
      return result.data
    } catch (err) {
      throw err
    }
  }

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    uploadDocument
  }
}

// Hook for community member profiles and participation
export const useCommunityMembers = (filters: {
  role?: string
  verified?: boolean
  limit?: number
} = {}) => {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await supabaseHelpers.getCommunityMembers(filters)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch community members')
      }
      
      setMembers(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return {
    members,
    loading,
    error,
    refetch: fetchMembers
  }
}

// Hook for governance statistics and transparency metrics
export const useGovernanceStats = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await supabaseHelpers.getGovernanceStats()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch governance stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// Hook for file uploads with governance document support
export const useGovernanceFileUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (
    file: File, 
    bucket: 'governance' | 'articles' | 'events' | 'profiles' = 'governance'
  ) => {
    try {
      setUploading(true)
      setError(null)
      
      // Check file size (max 10MB for governance documents)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Please keep under 10MB for governance documents.')
      }

      // Check file type for governance documents
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
      ]
      
      if (bucket === 'governance' && !allowedTypes.includes(file.type)) {
        throw new Error('Only PDF, DOC, DOCX, TXT, and MD files are supported for governance documents.')
      }

      const result = await supabaseHelpers.uploadFile(file, bucket)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to upload file')
      }

      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      throw err
    } finally {
      setUploading(false)
    }
  }

  return {
    uploadFile,
    uploading,
    error
  }
}