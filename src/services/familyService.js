import { supabase } from '../supabaseClient'

/**
 * Generate a random 6-character uppercase alphanumeric code (e.g. TN7829)
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create a new family and link the creator to it
 */
export async function createFamily({ name, userId }) {
  const inviteCode = generateInviteCode()
  const familyName = name.trim() || 'My Family'

  // Step 1: Insert into families
  const { data: family, error: famError } = await supabase
    .from('families')
    .insert([
      {
        name: familyName,
        invite_code: inviteCode,
      },
    ])
    .select()
    .single()

  if (famError) throw famError

  // Step 2: Link the user's profile to this new family
  if (userId && family?.id) {
    const { error: profError } = await supabase
      .from('profiles')
      .update({ family_id: family.id })
      .eq('id', userId)

    if (profError) {
      console.warn('Could not link profile to family immediately:', profError.message)
    }
  }

  return family
}

/**
 * Join an existing family using a 6-digit invite code
 */
export async function joinFamilyByCode({ inviteCode, userId }) {
  const cleanCode = inviteCode.trim().toUpperCase()

  if (cleanCode.length !== 6) {
    throw new Error('Invite codes must be exactly 6 characters.')
  }

  // Step 1: Find the family by code
  const { data: family, error: findError } = await supabase
    .from('families')
    .select('*')
    .eq('invite_code', cleanCode)
    .maybeSingle()

  if (findError) throw findError

  if (!family) {
    throw new Error('Family not found with that 6-digit code. Please verify and try again.')
  }

  // Step 2: Link the user's profile
  if (userId) {
    const { error: linkError } = await supabase
      .from('profiles')
      .update({ family_id: family.id })
      .eq('id', userId)

    if (linkError) throw linkError
  }

  return family
}

/**
 * Fetch family info and invite code
 */
export async function getFamilyDetails(familyId) {
  if (!familyId) return null

  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Fetch all members of a family
 */
export async function getFamilyMembers(familyId) {
  if (!familyId) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', familyId)
    .order('points', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Update the family name
 */
export async function updateFamilyName(familyId, newName) {
  const cleanName = newName.trim()
  if (!cleanName) throw new Error('Family name cannot be empty.')

  const { data, error } = await supabase
    .from('families')
    .update({ name: cleanName })
    .eq('id', familyId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Parent adds or removes points from any family member (Kid or Parent)
 */
export async function adjustMemberPoints(memberId, deltaPoints) {
  const { data: prof, error: fetchErr } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', memberId)
    .single()

  if (fetchErr) throw fetchErr

  const currentPts = prof.points || 0
  const newPoints = Math.max(0, currentPts + Number(deltaPoints))

  const { data, error } = await supabase
    .from('profiles')
    .update({ points: newPoints })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Set exact points balance for a family member
 */
export async function setMemberPoints(memberId, exactPoints) {
  const safePoints = Math.max(0, parseInt(exactPoints, 10) || 0)

  const { data, error } = await supabase
    .from('profiles')
    .update({ points: safePoints })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data
}
