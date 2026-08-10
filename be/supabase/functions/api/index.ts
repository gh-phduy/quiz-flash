import { Hono } from 'hono'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const app = new Hono()

// Middleware to inject supabase client
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader || '' } }
  })
  
  c.set('supabase', supabase)
  await next()
})

app.get('/api/health-check', (c) => {
  return c.json({ status: 'ok', message: 'Backend is running on Supabase Edge Functions!' })
})

app.post('/api/profile/display-name', async (c) => {
  try {
    const supabase = c.get('supabase')
    const { newName } = await c.req.json()

    if (!newName) {
      return c.json({ success: false, error: 'Name is required' }, 400)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }

    // Update in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', user.id)

    if (profileError) {
      console.error('Database update error:', profileError)
      return c.json({ success: false, error: 'Failed to update profile' }, 500)
    }

    // Update auth user metadata
    // Dùng service role (admin) key để update metadata
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: { full_name: newName, name: newName } }
    )

    if (authError) {
      console.error('Auth update error:', authError)
    }

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Error updating display name:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

import {
  recordCardReview,
  recordBulkCardReviews,
  resetUserProgress,
  getStatusDashboard,
  getUpcomingReviews,
  getDueCardsToReview,
  testReviewSingleCard,
  testUpdateRepetitionsToTwo
} from './services/review.ts'

app.post('/api/review/record', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  
  const { cardId, quality, mode, clientLocalDateStr } = await c.req.json()
  const result = await recordCardReview(supabase, user.id, cardId, quality, mode, clientLocalDateStr)
  return c.json(result)
})

app.post('/api/review/record-bulk', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  
  const { reviews, clientLocalDateStr } = await c.req.json()
  const result = await recordBulkCardReviews(supabase, user.id, reviews, clientLocalDateStr)
  return c.json(result)
})

app.post('/api/review/reset', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  
  const result = await resetUserProgress(supabase, user.id)
  return c.json(result)
})

app.get('/api/review/status', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  
  const targetUserId = c.req.query('targetUserId') || user.id
  const result = await getStatusDashboard(supabase, targetUserId)
  return c.json(result)
})

app.get('/api/review/upcoming', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  
  const targetUserId = c.req.query('targetUserId') || user.id
  const result = await getUpcomingReviews(supabase, targetUserId)
  return c.json(result)
})

app.get('/api/review/due', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  
  const clientLocalDateStr = c.req.query('localDate')
  const result = await getDueCardsToReview(supabase, user.id, clientLocalDateStr)
  return c.json(result)
})

import { generateGameSession, checkNewCardsForSession, updateGameScores, logGameSession } from './services/game.ts'
import { getOxfordSetsSummary, getSetDetailsAnalytics, getOxfordAnalytics } from './services/oxford.ts'
import { recordPoints, recordStudyActivity } from './services/study.ts'
import { saveSetToLibrary, unsaveSetFromLibrary, checkIsSetSaved, requestEditAccess, respondToEditRequest, getNotifications, markNotificationAsRead, checkCollaboratorStatus } from './services/collaboration.ts'

// --- GAME ROUTES ---
app.post('/api/game/session', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { setId, totalCardsToLearn, mode } = await c.req.json()
  const result = await generateGameSession(supabase, user.id, setId, totalCardsToLearn, mode)
  return c.json(result)
})

app.post('/api/game/check-new', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { cardIds } = await c.req.json()
  const result = await checkNewCardsForSession(supabase, user.id, cardIds)
  return c.json({ data: result })
})

app.post('/api/game/scores', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { correctCardIds, incorrectCardIds } = await c.req.json()
  const result = await updateGameScores(supabase, user.id, correctCardIds, incorrectCardIds)
  return c.json(result)
})

app.post('/api/game/log', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const params = await c.req.json()
  const result = await logGameSession(supabase, user.id, params)
  return c.json(result)
})

// --- OXFORD ROUTES ---
app.get('/api/oxford/summary', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const targetUserId = c.req.query('targetUserId')
  const result = await getOxfordSetsSummary(supabase, user.id, targetUserId)
  return c.json(result)
})

app.get('/api/oxford/analytics', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const targetUserId = c.req.query('targetUserId')
  const result = await getOxfordAnalytics(supabase, user.id, targetUserId)
  return c.json(result)
})

app.get('/api/oxford/details/:setId', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const targetUserId = c.req.query('targetUserId')
  const setId = c.req.param('setId')
  const result = await getSetDetailsAnalytics(supabase, user.id, setId, targetUserId)
  return c.json(result)
})

// --- STUDY ROUTES ---
app.post('/api/study/record-points', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { pointsToAdd } = await c.req.json()
  const result = await recordPoints(supabase, user.id, pointsToAdd)
  return c.json(result)
})

app.post('/api/study/activity', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { setId, pointsToAdd, wordsInSet, mode } = await c.req.json()
  const result = await recordStudyActivity(supabase, user.id, setId, pointsToAdd, wordsInSet, mode)
  return c.json(result)
})

// --- COLLAB ROUTES ---
app.post('/api/collab/save', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { setId } = await c.req.json()
  const result = await saveSetToLibrary(supabase, user.id, setId)
  return c.json(result)
})

app.post('/api/collab/unsave', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { setId } = await c.req.json()
  const result = await unsaveSetFromLibrary(supabase, user.id, setId)
  return c.json(result)
})

app.get('/api/collab/saved-status/:setId', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const setId = c.req.param('setId')
  const result = await checkIsSetSaved(supabase, user.id, setId)
  return c.json({ isSaved: result })
})

app.post('/api/collab/request-access', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { setId } = await c.req.json()
  const result = await requestEditAccess(supabase, user.id, setId)
  return c.json(result)
})

app.post('/api/collab/respond-request', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { notificationId, accept } = await c.req.json()
  const result = await respondToEditRequest(supabase, user.id, notificationId, accept)
  return c.json(result)
})

app.get('/api/collab/notifications', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const result = await getNotifications(supabase, user.id)
  return c.json(result)
})

app.post('/api/collab/mark-read', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const { notificationId } = await c.req.json()
  const result = await markNotificationAsRead(supabase, user.id, notificationId)
  return c.json(result)
})

app.get('/api/collab/status/:setId', async (c) => {
  const supabase = c.get('supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const setId = c.req.param('setId')
  const result = await checkCollaboratorStatus(supabase, user.id, setId)
  return c.json(result)
})

Deno.serve(app.fetch)
