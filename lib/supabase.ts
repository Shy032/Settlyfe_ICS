import { createClient } from '@supabase/supabase-js'
import type { Account, Employee, User } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug logging
console.log('Supabase Config:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})

// Database operations wrapper
export class SupabaseService {
  // User authentication
  static async signUp(email: string, password: string, userData: any) {
    console.log('Attempting signup...')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    if (error) console.error('Signup error:', error)
    else console.log('Signup successful')
    return { data, error }
  }

  static async signIn(email: string, password: string) {
    console.log('Attempting signin...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) console.error('Signin error:', error)
    else console.log('Signin successful')
    return { data, error }
  }

  static async signOut() {
    console.log('Attempting signout...')
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Signout error:', error)
    else console.log('Signout successful')
    return { error }
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // Account operations
  static async getAccountById(accountId: string) {
    console.log('Fetching account by ID:', accountId)
    const { data, error } = await supabase
      .from('account')
      .select(`
        *,
        employee:employee_id (*)
      `)
      .eq('id', accountId)
      .single()
    
    if (error) console.error('Get account error:', error)
    else console.log('Account fetched')
    return { data, error }
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

  static async createAccount(accountData: any) {
    console.log('Creating account:', accountData.login_email)
    const { data, error } = await supabase
      .from('account')
      .insert([accountData])
      .select()
    
    if (error) console.error('Create account error:', error)
    else console.log('Account created:', data)
    return { data, error }
  }

  static async updateAccount(accountId: string, accountData: any) {
    console.log('Updating account:', accountId)
    const { data, error } = await supabase
      .from('account')
      .update(accountData)
      .eq('id', accountId)
      .select()
    
    if (error) console.error('Update account error:', error)
    else console.log('Account updated')
    return { data, error }
  }

  // Employee operations
  static async getEmployees() {
    console.log('Fetching employees...')
    const { data, error } = await supabase
      .from('employee')
      .select(`
        *,
        team:team_id (*),
        department:department_id (*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) console.error('Get employees error:', error)
    else console.log('Employees fetched:', data?.length)
    return { data, error }
  }

  static async getEmployeeById(employeeId: string) {
    console.log('Fetching employee by ID:', employeeId)
    const { data, error } = await supabase
      .from('employee')
      .select(`
        *,
        team:team_id (*),
        department:department_id (*)
      `)
      .eq('id', employeeId)
      .single()
    
    if (error) console.error('Get employee error:', error)
    else console.log('Employee fetched')
    return { data, error }
  }

  static async createEmployee(employeeData: any) {
    console.log('Creating employee:', employeeData.first_name, employeeData.last_name)
    const { data, error } = await supabase
      .from('employee')
      .insert([employeeData])
      .select()
    
    if (error) console.error('Create employee error:', error)
    else console.log('Employee created:', data)
    return { data, error }
  }

  static async updateEmployee(employeeId: string, employeeData: any) {
    console.log('Updating employee:', employeeId)
    const { data, error } = await supabase
      .from('employee')
      .update(employeeData)
      .eq('id', employeeId)
      .select()
    
    if (error) console.error('Update employee error:', error)
    else console.log('Employee updated')
    return { data, error }
  }

  // User creation during signup (creates both account and employee)
  static async createUserProfile(userData: {
    accountId: string
    email: string
    firstName: string
    lastName: string
    role?: string
    teamId?: string
    departmentId?: string
    theme?: string
    preferredLanguage?: string
  }) {
    console.log('Creating user profile for:', userData.email)
    
    try {
      // Use the atomic database function that bypasses RLS
      console.log('Calling atomic user profile creation function with data:', userData)
      
      const { data: result, error } = await supabase.rpc('create_user_profile_atomic', {
        user_data: userData
      })
      
      if (error) {
        console.error('Database function error:', error)
        const errorMessage = error?.message || 
                           error?.hint || 
                           error?.details || 
                           JSON.stringify(error) || 
                           'Unknown database function error'
        throw new Error(`Failed to create user profile: ${errorMessage}`)
      }
      
      if (!result || !result.success) {
        console.error('Function returned error:', result)
        throw new Error(result?.message || 'Unknown error from database function')
      }
      
      console.log('User profile created successfully via database function')
      
      return { 
        data: {
          account: result.account,
          employee: result.employee
        }, 
        error: null 
      }
    } catch (error: any) {
      console.error('Error in createUserProfile:', error)
      return { data: null, error: { message: error.message } }
    }
  }

  // Get full user data (account + employee) by account ID
  static async getFullUserByAccountId(accountId: string) {
    console.log('Fetching full user data for account:', accountId)
    
    // First get the account data
    const { data: accountData, error: accountError } = await supabase
      .from('account')
      .select('*')
      .eq('id', accountId)
      .single()

    if (accountError) {
      console.error('Get account error:', accountError)
      return { data: null, error: accountError }
    }

    if (!accountData.employee_id) {
      console.error('No employee_id found in account:', accountId)
      return { data: null, error: { message: 'Employee ID not found in account' } }
    }

    // Then get the employee data separately
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .select('*')
      .eq('id', accountData.employee_id)
      .single()

    if (employeeError) {
      console.error('Get employee error:', employeeError)
      return { data: null, error: employeeError }
    }

    // Convert to User interface
    const user: User = {
      accountId: accountData.id,
      loginEmail: accountData.login_email,
      accessLevel: accountData.access_level,
      accountStatus: accountData.status,
      employeeId: employeeData.id,
      firstName: employeeData.first_name,
      lastName: employeeData.last_name,
      name: `${employeeData.first_name} ${employeeData.last_name}`,
      title: employeeData.title,
      role: employeeData.role,
      teamId: employeeData.team_id,
      departmentId: employeeData.department_id,
      joinDate: employeeData.join_date,
      status: employeeData.status,
      overallAssessment: employeeData.overall_assessment,
      phone: employeeData.phone,
      personalEmail: employeeData.personal_email,
      githubEmail: employeeData.github_email,
      zoomEmail: employeeData.zoom_email,
      note: employeeData.note,
      profilePhoto: employeeData.profile_photo,
      theme: employeeData.theme || 'light',
      preferredLanguage: employeeData.preferred_language || 'en',
      createdAt: accountData.created_at,
      updatedAt: accountData.updated_at
    }

    console.log('Full user data retrieved')
    return { data: user, error: null }
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

  static async createTeam(teamData: any) {
    console.log('Creating team:', teamData.name)
    const { data, error } = await supabase
      .from('team')
      .insert([teamData])
      .select()
    
    if (error) console.error('Create team error:', error)
    else console.log('Team created')
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

  static async createDailyUpdate(updateData: any) {
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
        employee_id:   upd.uid,                       // who did it
        action_type:   'create',                      // what happened
        object_type:   'daily_update',                // on which entity
        object_id:     upd.id,                        // the new record’s PK
        change_summary:`Created update for ${upd.date}` // human-readable detail
      })
    }
    return { data, error }
  }

  static async updateDailyUpdate(id: string, updateData: any) {
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
        employee_id:   data[0].uid,
        action_type:   'update',
        object_type:   'daily_update',
        object_id:     id,
        change_summary:`Updated fields: ${Object.keys(updateData).join(', ')}`
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

  static async createClockinSession(sessionData: any) {
    console.log('Creating clock-in session:', sessionData)
    const { data, error } = await supabase
      .from('clockin_session')
      .insert([sessionData])
      .select()

    if (error) console.error('Create clock-in session error:', error)
    else console.log('Clock-in session created:', data)

    return { data, error }
  }

  static async updateClockinSession(id: string, sessionData: any) {
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
      }
    }

    return { data, error }
  }

  

  // Weekly credit score operations
  static async getWeeklyScores(employeeId?: string, limit = 12) {
    console.log('Fetching weekly scores...')
    let query = supabase
      .from('weekly_credit_score')
      .select(`
        *,
        employee!fk_weekly_score_employee (first_name, last_name, personal_email),
        admin:employee!fk_weekly_score_admin (first_name, last_name)
      `)
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

  static async createWeeklyScore(scoreData: any) {
    console.log('Creating weekly score...')
    const { data, error } = await supabase
      .from('weekly_credit_score')
      .insert([scoreData])
      .select()
    if (error) console.error('Create weekly score error:', error)
    else console.log('Weekly score created')
    return { data, error }
  }

  static async updateWeeklyScore(employeeId: string, weekNumber: number, year: number, scoreData: any) {
    console.log('Updating weekly score:', employeeId, weekNumber, year)
    const { data, error } = await supabase
      .from('weekly_credit_score')
      .update(scoreData)
      .eq('employee_id', employeeId)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .select()
    if (error) console.error('Update weekly score error:', error)
    else console.log('Weekly score updated')
    return { data, error }
  }

  // Tasks operations
  static async getTasks(teamId?: string, employeeId?: string) {
    console.log('Fetching tasks...')
    let query = supabase
      .from('task')
      .select(`
        *,
        admin:employee!fk_task_admin (first_name, last_name),
        task_assignment!fk_task_assignment_task (
          assignee:employee!fk_task_assignment_assignee (first_name, last_name, team_id)
        )
      `)
      .order('created_at', { ascending: false })

    // If filtering by team or employee, we need to join with assignments
    if (teamId || employeeId) {
      if (employeeId) {
        query = query.eq('task_assignment.assignee_id', employeeId)
      } else if (teamId) {
        query = query.eq('task_assignment.assignee.team_id', teamId)
      }
    }

    const { data, error } = await query
    if (error) console.error('Get tasks error:', error)
    else console.log('Tasks fetched:', data?.length)
    return { data, error }
  }

  static async createTask(taskData: any) {
    console.log('Creating task...')
    const { data, error } = await supabase
      .from('task')
      .insert([taskData])
      .select()

    if (error) {
      console.error("Error saving to Supabase:", JSON.stringify(error, null, 2))
    }
    else console.log('Task created')
    console.log("Returned Supabase data:", data)
    return { data, error }
  }

  static async updateTask(id: string, taskData: any) {
    console.log('Updating task:', id)
    const { data, error } = await supabase
      .from('task')
      .update(taskData)
      .eq('id', id)
      .select()

    if (error) console.error('Update task error:', error)
    else console.log('Task updated')

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
    employee_id: string;
    action_type: string;
    object_type: string;
    object_id?: string;
    change_summary?: string;
  }) {
    const { error } = await supabase
      .from('audit_log')
      .insert([{
        employee_id,
        action_type,
        object_type,
        object_id: object_id ?? null,
        change_summary: change_summary ?? null,
      }]);
    if (error) console.error('auditLog error:', error);
  }


  static async getAuditLogs() {
    return supabase
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false });
  }




} 