import { createBrowserClient } from '@supabase/ssr'
import type { Account, Employee } from '@/types'
import { getFullName } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug logging
console.log('Supabase Config:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing'
})

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Timeout wrapper for database queries
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 2000,
  errorMessage: string = 'Query timeout'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

// Database operations wrapper
export class SupabaseService {
  // Authentication and Account Management
  static async signUp(email: string, password: string) {
    console.log('Attempting signup...')
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) console.error('Signup error:', error)
    else {
      console.log('Signup successful')
      // Note: Audit log will be created later when the employee profile is created
      // Cannot create audit log here because employee record doesn't exist yet
    }
    return { data, error }
  }

  static async signIn(email: string, password: string) {
    console.log('Attempting signin...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) console.error('Signin error:', error)
    else {
      console.log('Signin successful')
      await this.auditLog({
        employee_id: data.user?.id,
        action_type: 'signin',
        object_type: 'account',
        object_id: data.user?.id,
        change_summary: 'User signed in'
      })
    }
    return { data, error }
  }

  static async signOut() {
    console.log('Attempting signout...')
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Signout error:', error)
    else console.log('Signout successful')
    return { error }
  }

  static async getCurrentAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // Account operations
  static async getAccountById(account_id: string) {
    console.log('Fetching account by ID:', account_id)
    try {
      const query = supabase
        .from('account')
        .select(`
          *,
          employee:employee_id (*)
        `)
        .eq('id', account_id)
        .single()
      
      const result = await withTimeout(
        Promise.resolve(query),
        2000,
        'Account fetch timeout - please check your connection'
      )
      
      const { data, error } = result as any
      if (error) console.error('Get account error:', error)
      else console.log('Account fetched')
      return { data, error }
    } catch (error: any) {
      console.error('Get account timeout or error:', error)
      return { data: null, error: { message: error.message } }
    }
  }

  static async getAccountByEmail(email: string) {
    console.log('Fetching account by email:', email)
    const { data, error } = await supabase
      .from('account')
      .select(`
        *,
        employee:employee_id (*)
      `)
      .eq('login_email', email)
      .single()
    
    if (error) console.error('Get account by email error:', error)
    else console.log('Account fetched by email')
    return { data, error }
  }

  static async updateAccount(account_id: string, accountData: Partial<Account>) {
    console.log('Updating account:', account_id)
    const { data, error } = await supabase
      .from('account')
      .update(accountData)
      .eq('id', account_id)
      .select()
    
    if (error) console.error('Update account error:', error)
    else {
      console.log('Account updated')
      await this.auditLog({
        employee_id: accountData.employee_id || '',
        action_type: 'update',
        object_type: 'account',
        object_id: account_id,
        change_summary: `Updated account fields: ${Object.keys(accountData).join(', ')}`
      })
    }
    return { data, error }
  }

  // Employee operations
  static async getEmployees() {
    console.log('Fetching employees...')
    const { data, error } = await supabase
      .from('employee')
      .select(`
        *,
        account!employee_id (login_email, access_level, status),
        team:team_id (*),
        department:department_id (*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) console.error('Get employees error:', error)
    else console.log('Employees fetched:', data?.length)
    return { data, error }
  }

  static async getEmployeeById(employee_id: string) {
    console.log('Fetching employee by ID:', employee_id)
    try {
      const query = supabase
        .from('employee')
        .select(`
          *,
          account!employee_id (login_email, access_level, status),
          team:team_id (*),
          department:department_id (*)
        `)
        .eq('id', employee_id)
        .single()
      
      const result = await withTimeout(
        Promise.resolve(query as unknown as Promise<any>),
        2000,
        'Employee fetch timeout - please check your connection'
      )
      
      const { data, error } = result as any
      if (error) console.error('Get employee error:', error)
      else console.log('Employee fetched')
      return { data, error }
    } catch (error: any) {
      console.error('Get employee timeout or error:', error)
      return { data: null, error: { message: error.message } }
    }
  }

  static async updateEmployee(employee_id: string, employeeData: Partial<Employee>) {
    console.log('Updating employee:', employee_id)
    const { data, error } = await supabase
      .from('employee')
      .update(employeeData)
      .eq('id', employee_id)
      .select()
    
    if (error) console.error('Update employee error:', error)
    else {
      console.log('Employee updated')
      await this.auditLog({
        employee_id,
        action_type: 'update',
        object_type: 'employee',
        object_id: employee_id,
        change_summary: `Updated employee fields: ${Object.keys(employeeData).join(', ')}`
      })
    }
    return { data, error }
  }

  // Create both account and employee during signup
  // first_name and last_name are optional - will use placeholders if not provided
  static async createEmployeeProfile(data: {
    account_id: string
    email: string
    first_name?: string
    last_name?: string
    access_level: string
  }) {
    console.log('Creating employee profile for:', data.email)
    
    try {
      // Use atomic database function that handles both account and employee creation
      const { data: result, error } = await supabase.rpc('create_employee_profile_atomic', {
        profile_data: data
      })
      
      if (error) {
        console.error('Database function error:', error)
        const errorMessage = error?.message || 
                           error?.hint || 
                           error?.details || 
                           JSON.stringify(error) || 
                           'Unknown database function error'
        throw new Error(`Failed to create employee profile: ${errorMessage}`)
      }
      
      if (!result || !result.success) {
        console.error('Function returned error:', result)
        throw new Error(result?.message || 'Unknown error from database function')
      }
      
      console.log('Employee profile created successfully')
      
      // Note: Audit log is already created by the database function
      // No need to create a duplicate audit log entry here
      
      return {
        data: {
          account: result.account,
          employee: result.employee
        }, 
        error: null 
      }
    } catch (error: any) {
      console.error('Error in createEmployeeProfile:', error)
      return { data: null, error: { message: error.message } }
    }
  }

  // Get complete employee data by account ID
  static async getEmployeeByAccountId(account_id: string) {
    console.log('Fetching employee data for account:', account_id)
    
    // Get the account with associated employee data
    const { data: accountData, error: accountError } = await supabase
      .from('account')
      .select(`
        *,
        employee:employee_id (*)
      `)
      .eq('id', account_id)
      .single()

    if (accountError) {
      console.error('Get account error:', accountError)
      return { data: null, error: accountError }
    }

    if (!accountData.employee_id || !accountData.employee) {
      console.error('No employee found for account:', account_id)
      return { data: null, error: { message: 'No employee profile found for account' } }
    }

    const result = {
      account: {
        id: accountData.id,
        login_email: accountData.login_email,
        access_level: accountData.access_level,
        status: accountData.status,
        employee_id: accountData.employee_id,
        created_at: accountData.created_at,
        updated_at: accountData.updated_at
      } as Account,
      employee: accountData.employee as Employee
    }

    console.log('Employee data retrieved')
    return { data: result, error: null }
  }

  // Team operations
  static async getTeams() {
    console.log('Fetching teams...')
    const { data, error } = await supabase
      .from('team')
      .select(`
        *,
        lead_employee:employee!fk_team_lead (first_name, last_name)
      `)
      .order('name')
    
    if (error) console.error('Get teams error:', error)
    else console.log('Teams fetched:', data?.length)
    return { data, error }
  }

  static async createTeam(teamData: {
    name: string
    lead_employee_id?: string
    parent_team_id?: string
  }) {
    console.log('Creating team:', teamData.name)
    const { data, error } = await supabase
      .from('team')
      .insert([teamData])
      .select()
    
    if (error) console.error('Create team error:', error)
    else {
      console.log('Team created')
      if (data?.length) {
        await this.auditLog({
          employee_id: teamData.lead_employee_id,
          action_type: 'create',
          object_type: 'team',
          object_id: data[0].id,
          change_summary: `Created team: ${teamData.name}`
        })
      }
    }
    return { data, error }
  }

  // Department operations
  static async getDepartments() {
    console.log('Fetching departments...')
    const { data, error } = await supabase
      .from('department')
      .select(`
        *,
        head_employee:head_employee_id (first_name, last_name)
      `)
      .order('name')
    
    if (error) console.error('Get departments error:', error)
    else console.log('Departments fetched:', data?.length)
    return { data, error }
  }

  // Daily updates operations
  static async getDailyUpdates(employeeId?: string, limit = 50) {
    console.log('Fetching daily updates...')
    let query = supabase
      .from('daily_update')
      .select(`
        *,
        employee:employee_id (first_name, last_name, personal_email),
        task:task_id (title)
      `)
      .order('date', { ascending: false })
      .limit(limit)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query
    if (error) console.error('Get daily updates error:', error)
    else console.log('Daily updates fetched:', data?.length)
    return { data, error }
  }

  static async createDailyUpdate(updateData: {
    employee_id: string;
    date: string;
    description: string;
    task_id?: string;
    location?: string;
    screenshot_path?: string;
  }) {
    console.log('Creating daily update...')
    const { data, error } = await supabase
      .from('daily_update')
      .insert([updateData])
      .select()
    if (error){
      console.error('Create daily update error:', error)
    } 
    else if (data?.length) {
      console.log('Daily update created')

      // 3) right here—after successful creation—write your audit entry
      const upd = data[0]
      await SupabaseService.auditLog({
        employee_id: upd.employee_id,
        action_type:   'create',                      // what happened
        object_type:   'daily_update',                // on which entity
        object_id:     upd.id,                        // the new record’s PK
        change_summary:`Created update for ${upd.date}` // human-readable detail
      })
    }
    return { data, error }
  }

  static async updateDailyUpdate(id: string, updateData: Partial<{
    employee_id: string;
    date: string;
    description: string;
    task_id?: string;
    location?: string;
    screenshot_path?: string;
  }>) {
    console.log('Updating daily update:', id)
    const { data, error } = await supabase
      .from('daily_update')
      .update(updateData)
      .eq('id', id)
      .select()
    if (error) console.error('Update daily update error:', error)
    else if (data?.length){
      console.log('Daily update updated')

      await SupabaseService.auditLog({
        employee_id: data[0].employee_id,
        action_type: 'update',
        object_type: 'daily_update',
        object_id: id,
        change_summary: `Updated fields: ${Object.keys(updateData).join(', ')}`
      })
    }
    return { data, error }
  }

  // Clock-in session operations
  static async getClockinSessions(employeeId?: string, startDate?: string, endDate?: string) {
    console.log('Fetching clock-in sessions...', { employeeId, startDate, endDate })
    let query = supabase
      .from('clockin_session')
      .select(`
        *,
        employee:employee_id (first_name, last_name, personal_email)
      `)
      .order('date', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query
    if (error) console.error('Get clock-in sessions error:', error)
    else console.log('Clock-in sessions fetched:', data?.length)
    return { data, error }
  }

  static async createClockinSession(sessionData: {
    employee_id: string
    date: string
    start_time: string
    end_time?: string
    duration?: string
    hours?: number
    description?: string
  }) {
    console.log('Creating clock-in session:', sessionData)
    const { data, error } = await supabase
      .from('clockin_session')
      .insert([sessionData])
      .select()

    if (error) console.error('Create clock-in session error:', error)
    else {
      console.log('Clock-in session created:', data)
      if (data?.length) {
        await this.auditLog({
          employee_id: sessionData.employee_id,
          action_type: 'create',
          object_type: 'clockin_session',
          object_id: data[0].id,
          change_summary: `Created clock-in session for ${sessionData.date}`
        })
      }
    }

    return { data, error }
  }

  static async updateClockinSession(id: string, sessionData: Partial<{
    employee_id: string
    date: string
    start_time: string
    end_time?: string
    duration?: string
    hours?: number
    description?: string
  }>) {
    console.log('Updating clock-in session:', id, sessionData)
    const { data, error } = await supabase
      .from('clockin_session')
      .update(sessionData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Update clock-in session error:', error)
    } else {
      console.log('Clock-in session update response:', data)
      if (!data || data.length === 0) {
        console.warn('⚠️ Update successful but no rows were affected. This might be due to RLS policies or the record not existing.')
      } else {
        console.log('✅ Clock-in session successfully updated:', data[0])
        await this.auditLog({
          employee_id: sessionData.employee_id,
          action_type: 'update',
          object_type: 'clockin_session',
          object_id: id,
          change_summary: `Updated clock-in session fields: ${Object.keys(sessionData).join(', ')}`
        })
      }
    }

    return { data, error }
  }

  

  // Weekly credit score operations
  static async getWeeklyScores(employeeId?: string, limit = 12) {
    console.log('Fetching weekly scores...')
    let query = supabase
      .from('weekly_credit_score')
      .select('*')
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(limit)
      
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }


    const { data, error } = await query
    if (error) console.error('Get weekly scores error:', error)
    else console.log('Weekly scores fetched:', data?.length)

    return { data, error }
  }

  static async createWeeklyScore(scoreData: {
    employee_id: string
    admin_id: string
    week_number: number
    year: number
    effort_credit: number
    outcome_credit: number
    collab_credit: number
    wcs: number
    checkmarks: number
  }) {
    console.log('Creating weekly score...')
    const { data, error } = await supabase
      .from('weekly_credit_score')
      .insert([scoreData])
      .select()
    if (error) console.error('Create weekly score error:', error)
    else {
      console.log('Weekly score created')
      if (data?.length) {
        await this.auditLog({
          employee_id: scoreData.admin_id,
          action_type: 'create',
          object_type: 'weekly_credit_score',
          object_id: data[0].id,
          change_summary: `Created weekly score for ${scoreData.employee_id}, week ${scoreData.week_number}/${scoreData.year}`
        })
      }
    }
    return { data, error }
  }

  static async updateWeeklyScore(employeeId: string, weekNumber: number, year: number, scoreData: Partial<{
    admin_id: string
    effort_credit: number
    outcome_credit: number
    collab_credit: number
    wcs: number
    checkmarks: number
  }>) {
    console.log('Updating weekly score:', employeeId, weekNumber, year)
    const { data, error } = await supabase
      .from('weekly_credit_score')
      .update(scoreData)
      .eq('employee_id', employeeId)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .select()
    if (error) console.error('Update weekly score error:', error)
    else {
      console.log('Weekly score updated')
      if (data?.length) {
        await this.auditLog({
          employee_id: scoreData.admin_id,
          action_type: 'update',
          object_type: 'weekly_credit_score',
          object_id: data[0].id,
          change_summary: `Updated weekly score fields: ${Object.keys(scoreData).join(', ')}`
        })
      }
    }
    return { data, error }
  }

  // Quarter Score operations
  static async getQuarterScores(employeeId?: string) {
    console.log('Fetching quarter scores...')
    let query = supabase
      .from('quarter_score')
      .select(`
        *,
        employee:employee_id (first_name, last_name)
      `)
      .order('year', { ascending: false })
      .order('quarter_number', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query
    if (error) console.error('Get quarter scores error:', error)
    return { data, error }
  }

  static async createQuarterScore(scoreData: {
    employee_id: string
    year: number
    quarter_number: number
    qs: number
    cumulative_checkmarks: number
    assessment?: string
  }) {
    console.log('Creating quarter score...')
    const { data, error } = await supabase
      .from('quarter_score')
      .insert([scoreData])
      .select()

    if (!error && data?.length) {
      await this.auditLog({
        employee_id: scoreData.employee_id,
        action_type: 'create',
        object_type: 'quarter_score',
        object_id: data[0].id,
        change_summary: `Created Q${scoreData.quarter_number}/${scoreData.year} score`
      })
    }
    return { data, error }
  }

  // Executive Decision operations
  static async getExecutiveDecisions() {
    console.log('Fetching executive decisions...')
    const { data, error } = await supabase
      .from('executive_decision')
      .select(`
        *,
        admin:admin_id (first_name, last_name)
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  }

  static async createExecutiveDecision(decisionData: {
    admin_id: string
    title: string
    description: string
    date: string
  }) {
    console.log('Creating executive decision...')
    const { data, error } = await supabase
      .from('executive_decision')
      .insert([decisionData])
      .select()

    if (!error && data?.length) {
      await this.auditLog({
        employee_id: decisionData.admin_id,
        action_type: 'create',
        object_type: 'executive_decision',
        object_id: data[0].id,
        change_summary: `Created decision: ${decisionData.title}`
      })
    }
    return { data, error }
  }

  // PTO Request operations
  static async getPTORequests(employeeId?: string) {
    console.log('Fetching PTO requests...')
    let query = supabase
      .from('pto_request')
      .select(`
        *,
        employee:employee_id (first_name, last_name),
        approver:approved_by (first_name, last_name)
      `)
      .order('request_date', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query
    return { data, error }
  }

  static async createPTORequest(requestData: {
    employee_id: string
    start_date: string
    end_date: string
    duration: number
    reasoning: string
    type: "urgent" | "planned"
    impact: string
    handover_details: string
  }) {
    console.log('Creating PTO request...')
    const { data, error } = await supabase
      .from('pto_request')
      .insert([requestData])
      .select()

    if (!error && data?.length) {
      await this.auditLog({
        employee_id: requestData.employee_id,
        action_type: 'create',
        object_type: 'pto_request',
        object_id: data[0].id,
        change_summary: `Created PTO request for ${requestData.start_date} to ${requestData.end_date}`
      })
    }
    return { data, error }
  }

  static async updatePTORequest(id: string, updateData: {
    status: "pending" | "approved" | "rejected"
    approved_by?: string
    approve_comments?: string
  }) {
    console.log('Updating PTO request:', id)
    const { data, error } = await supabase
      .from('pto_request')
      .update({
        ...updateData,
        approved_date: updateData.status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()

    if (!error && data?.length) {
      await this.auditLog({
        employee_id: updateData.approved_by,
        action_type: 'update',
        object_type: 'pto_request',
        object_id: id,
        change_summary: `PTO request ${updateData.status}`
      })
    }
    return { data, error }
  }

  // Poll operations
  static async getPolls(includeOptions = false) {
    console.log('Fetching polls...')
    const { data, error } = await supabase
      .from('poll')
      .select(`
        *,
        admin:admin_id (first_name, last_name)
        ${includeOptions ? ',options:poll_option(*)' : ''}
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  }

  static async createPoll(pollData: {
    admin_id: string
    title: string
    selection_type: "single-choice" | "multi-select"
    anonymous: boolean
    result_visibility: "live" | "hidden_until_close"
    options: string[]
  }) {
    const { title, options, ...rest } = pollData
    
    // Create poll
    const { data: createdPoll, error: pollError } = await supabase
      .from('poll')
      .insert([{ title, ...rest }])
      .select()
      .single()

    if (pollError || !createdPoll) return { data: null, error: pollError }

    // Create options
    const optionsData = options.map(text => ({
      poll_id: createdPoll.id,
      option_text: text
    }))

    const { error: optionsError } = await supabase
      .from('poll_option')
      .insert(optionsData)

    if (optionsError) return { data: null, error: optionsError }

    await this.auditLog({
      employee_id: createdPoll.admin_id,
      action_type: 'create',
      object_type: 'poll',
      object_id: createdPoll.id,
      change_summary: `Created poll: ${title}`
    })

    return { data: createdPoll, error: null }
  }

  // Public Document operations
  static async getPublicDocuments(visibility?: "everyone" | "team-only" | "department-only" | "admin-only") {
    console.log('Fetching public documents...')
    let query = supabase
      .from('public_document')
      .select(`
        *,
        uploader:uploaded_by (first_name, last_name)
      `)
      .order('upload_date', { ascending: false })

    if (visibility) {
      query = query.eq('visibility', visibility)
    }

    const { data, error } = await query
    return { data, error }
  }

  static async createPublicDocument(documentData: {
    visibility: "everyone" | "team-only" | "department-only" | "creator-only" | "admin-only"
    file_path: string
    type: string
    title: string
    description?: string
    uploaded_by: string
  }) {
    console.log('Creating public document...')
    const { data, error } = await supabase
      .from('public_document')
      .insert([documentData])
      .select()

    if (!error && data?.length) {
      await this.auditLog({
        employee_id: documentData.uploaded_by,
        action_type: 'create',
        object_type: 'public_document',
        object_id: data[0].id,
        change_summary: `Uploaded document: ${documentData.title}`
      })
    }
    return { data, error }
  }

  // Subscription helper
  static subscribeToTable(table: string, callback: (payload: any) => void) {
    console.log('Subscribing to table:', table)
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe()
  }

  // Audit logs
  /** Record an audit entry for later review */
  static async auditLog({
    employee_id,
    action_type,
    object_type,
    object_id,
    change_summary,
  }: {
    employee_id?: string;
    action_type: string;
    object_type: string;
    object_id?: string;
    change_summary?: string;
  }) {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert([{
          employee_id,
          action_type,
          object_type,
          object_id: object_id ?? null,
          change_summary: change_summary ?? null,
        }]);
      
      if (error) {
        // If audit_log table doesn't exist or has issues, just log a warning instead of throwing an error
        console.warn('Audit log failed (table may not exist):', error.message);
      }
    } catch (err) {
      // Catch any other errors and just warn - don't let audit logging break the main functionality
      console.warn('Audit log error caught:', err);
    }
  }


  static async getAuditLogs() {
    return supabase
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false });
  }




  // Tasks operations
  static async getTasks(employeeId?: string, accessLevel?: string, teamId?: string) {
    console.log('Fetching tasks with access control...')
    let query = supabase
      .from('task')
      .select(`
        *,
        admin:admin_id (
          id,
          first_name,
          last_name,
          team_id
        )
      `)
      .order('created_at', { ascending: false })

    // Access control filtering
    if (accessLevel === "owner" || accessLevel === "admin") {
      // Owners and admins can see all tasks
      console.log('Admin/Owner access: showing all tasks')
    } else {
      // Members can only see:
      // 1. Tasks they created (admin_id = their id)
      // 2. Tasks with visibility = "everyone"  
      // 3. Tasks with visibility = "team-only" if they're in the same team
      // 4. Tasks with visibility = "creator-only" if they created it
      
      if (employeeId && teamId) {
        query = query.or(`admin_id.eq.${employeeId},visibility.eq.everyone,and(visibility.eq.team-only,admin_id.in.(select id from employee where team_id='${teamId}')),and(visibility.eq.creator-only,admin_id.eq.${employeeId})`)
      } else if (employeeId) {
        query = query.or(`admin_id.eq.${employeeId},visibility.eq.everyone,and(visibility.eq.creator-only,admin_id.eq.${employeeId})`)
      } else {
        // Fallback: only show public tasks
        query = query.eq('visibility', 'everyone')
      }
    }

    const { data, error } = await query
    if (error) console.error('Get tasks error:', error)
    else console.log('Tasks fetched with access control:', data?.length)
    return { data, error }
  }

  static async createTask(taskData: {
    admin_id: string
    title: string
    description?: string
    publish_date: string
    due_date?: string
    completion_date?: string
    priority: "low" | "medium" | "high"
    visibility: "everyone" | "team-only" | "department-only" | "creator-only"
    status: "not-started" | "in-progress" | "completed" | "cancelled"
    progress: number
    is_key_result: boolean
    published: boolean
    attachment_group_id?: string
  }) {
    console.log('Creating task:', taskData.title)
    const { data, error } = await supabase
      .from('task')
      .insert([taskData])
      .select()

    if (error) {
      console.error('Create task error:', error)
      // Check if it's an authentication error
      if (error.message?.includes('JWT') || error.message?.includes('expired') || error.code === 'PGRST301') {
        console.warn('Authentication expired during task creation - user needs to refresh')
        // You could trigger a refresh here or show a message
      }
    } else {
      console.log('Task created')
      if (data?.length) {
        await this.auditLog({
          employee_id: taskData.admin_id,
          action_type: 'create',
          object_type: 'task',
          object_id: data[0].id,
          change_summary: `Created task: ${taskData.title}`
        })
      }
    }
    return { data, error }
  }

  static async updateTask(id: string, taskData: Partial<{
    admin_id: string
    title: string
    description?: string
    publish_date: string
    due_date?: string
    completion_date?: string
    priority: "low" | "medium" | "high"
    visibility: "everyone" | "team-only" | "department-only" | "creator-only"
    status: "not-started" | "in-progress" | "completed" | "cancelled"
    progress: number
    is_key_result: boolean
    published: boolean
    attachment_group_id?: string
  }>) {
    console.log('Updating task:', id)
    const { data, error } = await supabase
      .from('task')
      .update(taskData)
      .eq('id', id)
      .select()

    if (error) console.error('Update task error:', error)
    else {
      console.log('Task updated')
      if (data?.length) {
        await this.auditLog({
          employee_id: taskData.admin_id,
          action_type: 'update',
          object_type: 'task',
          object_id: id,
          change_summary: `Updated task fields: ${Object.keys(taskData).join(', ')}`
        })
      }
    }
    return { data, error }
  }

  static async deleteTask(id: string, adminId?: string) {
    console.log('Deleting task:', id)
    const { data, error } = await supabase
      .from('task')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Delete task error:', error)
    } else {
      console.log('Task deleted successfully:', data)
      if (adminId) {
        await this.auditLog({
          employee_id: adminId,
          action_type: 'delete',
          object_type: 'task',
          object_id: id,
          change_summary: `Deleted task with ID: ${id}`
        })
      }
    }
    return { data, error }
  }

} 