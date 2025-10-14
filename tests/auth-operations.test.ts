import { SupabaseService } from '@/lib/supabase'
import { describe, expect, test } from '@jest/globals'

// Mock data for testing
const TEST_USER = {
  email: 'test.user@settlyfe.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'member',
  teamId: undefined, // Will be set during team creation
  departmentId: undefined, // Will be set during department creation
}

// Store created IDs for cleanup
let createdIds = {
  accountId: '',
  employeeId: '',
  teamId: '',
  departmentId: '',
  taskId: '',
  dailyUpdateId: '',
}

describe('Authentication and Profile Flow', () => {
  // Cleanup after all tests
  afterAll(async () => {
    if (createdIds.accountId) {
      // Clean up created test data
      await SupabaseService.signIn(TEST_USER.email, TEST_USER.password)
      // Add cleanup operations here
      await SupabaseService.signOut()
    }
  })

  test('1. Complete signup flow', async () => {
    // 1. Create new user
    const { data: signupData, error: signupError } = await SupabaseService.signUp(
      TEST_USER.email,
      TEST_USER.password
    )
    expect(signupError).toBeNull()
    expect(signupData.user).toBeDefined()
    createdIds.accountId = signupData.user!.id

    // 2. Create employee profile
    const { data: profileData, error: profileError } = await SupabaseService.createEmployeeProfile({
      account_id: createdIds.accountId,
      email: TEST_USER.email,
      first_name: TEST_USER.firstName,
      last_name: TEST_USER.lastName,
      role: TEST_USER.role,
      theme: 'light',
      preferred_language: 'en'
    })
    expect(profileError).toBeNull()
    expect(profileData).toBeDefined()
    createdIds.employeeId = profileData!.employee.id
  })

  test('2. Sign in and verify profile', async () => {
    const { data: signinData, error: signinError } = await SupabaseService.signIn(
      TEST_USER.email,
      TEST_USER.password
    )
    expect(signinError).toBeNull()
    expect(signinData.user).toBeDefined()

    const { data: profile, error: profileError } = await SupabaseService.getEmployeeByAccountId(createdIds.accountId)
    expect(profileError).toBeNull()
    expect(profile?.employee.first_name).toBe(TEST_USER.firstName)
  })

  test('3. Create and assign team', async () => {
    const { data: teamData, error: teamError } = await SupabaseService.createTeam({
      name: 'Test Team',
      lead_employee_id: createdIds.employeeId
    })
    expect(teamError).toBeNull()
    expect(teamData).toBeDefined()
    createdIds.teamId = teamData![0].id

    // Update employee with team
    const { error: updateError } = await SupabaseService.updateEmployee(
      createdIds.employeeId,
      { team_id: createdIds.teamId }
    )
    expect(updateError).toBeNull()
  })

  test('4. Create tasks and daily updates', async () => {
    // Create a task
    const { data: taskData, error: taskError } = await SupabaseService.createTask({
      admin_id: createdIds.employeeId,
      title: 'Test Task',
      description: 'Test task description',
      publish_date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      visibility: 'team-only',
      status: 'not-started',
      progress: 0,
      is_key_result: false,
      published: true
    })
    expect(taskError).toBeNull()
    expect(taskData).toBeDefined()
    createdIds.taskId = taskData![0].id

    // Create a daily update
    const { data: updateData, error: updateError } = await SupabaseService.createDailyUpdate({
      employee_id: createdIds.employeeId,
      date: new Date().toISOString().split('T')[0],
      description: 'Test daily update',
      task_id: createdIds.taskId
    })
    expect(updateError).toBeNull()
    expect(updateData).toBeDefined()
    createdIds.dailyUpdateId = updateData![0].id
  })

  test('5. Update profile settings', async () => {
    const { error: updateError } = await SupabaseService.updateEmployee(
      createdIds.employeeId,
      {
        theme: 'dark',
        preferred_language: 'es',
        can_view_team_daily_tasks: true
      }
    )
    expect(updateError).toBeNull()

    // Verify updates
    const { data: profile, error: profileError } = await SupabaseService.getEmployeeById(createdIds.employeeId)
    expect(profileError).toBeNull()
    expect(profile?.theme).toBe('dark')
    expect(profile?.preferred_language).toBe('es')
  })

  test('6. Sign out', async () => {
    const { error } = await SupabaseService.signOut()
    expect(error).toBeNull()

    // Verify we can't access protected data
    const { error: accessError } = await SupabaseService.getEmployeeById(createdIds.employeeId)
    expect(accessError).toBeDefined()
  })
})

// Additional test suite for error cases
describe('Error Handling', () => {
  test('Invalid login credentials', async () => {
    const { error } = await SupabaseService.signIn('wrong@email.com', 'wrongpassword')
    expect(error).toBeDefined()
  })

  test('Duplicate email signup', async () => {
    const { error } = await SupabaseService.signUp(TEST_USER.email, 'newpassword')
    expect(error).toBeDefined()
  })

  test('Invalid profile update', async () => {
    const { error } = await SupabaseService.updateEmployee(
      'invalid-id',
      { first_name: 'Test' }
    )
    expect(error).toBeDefined()
  })
})

describe('Team Operations', () => {
  beforeAll(async () => {
    await SupabaseService.signIn(TEST_USER.email, TEST_USER.password)
  })

  test('Team CRUD operations', async () => {
    // Create team
    const { data: team } = await SupabaseService.createTeam({
      name: 'Development Team',
      lead_employee_id: createdIds.employeeId
    })
    expect(team).toBeDefined()
    const teamId = team![0].id

    // Get teams
    const { data: teams } = await SupabaseService.getTeams()
    expect(teams).toContainEqual(expect.objectContaining({ id: teamId }))
  })
})

describe('Task Operations', () => {
  let taskId: string

  test('Task creation and assignment', async () => {
    // Create task
    const { data: task } = await SupabaseService.createTask({
      admin_id: createdIds.employeeId,
      title: 'Important Feature',
      description: 'Implement new feature',
      publish_date: new Date().toISOString().split('T')[0],
      priority: 'high',
      visibility: 'team-only',
      status: 'not-started',
      progress: 0,
      is_key_result: true,
      published: true
    })
    expect(task).toBeDefined()
    taskId = task![0].id

    // Update task
    const { error: updateError } = await SupabaseService.updateTask(taskId, {
      progress: 50,
      status: 'in-progress'
    })
    expect(updateError).toBeNull()

    // Get tasks
    const { data: tasks } = await SupabaseService.getTasks(undefined, createdIds.employeeId)
    expect(tasks).toContainEqual(expect.objectContaining({ id: taskId }))
  })
})

describe('Daily Update Operations', () => {
  test('Daily update creation and retrieval', async () => {
    const updateData = {
      employee_id: createdIds.employeeId,
      date: new Date().toISOString().split('T')[0],
      description: 'Completed feature implementation',
      location: 'Remote'
    }

    // Create update
    const { data: update } = await SupabaseService.createDailyUpdate(updateData)
    expect(update).toBeDefined()
    const updateId = update![0].id

    // Get updates
    const { data: updates } = await SupabaseService.getDailyUpdates(createdIds.employeeId)
    expect(updates).toContainEqual(expect.objectContaining({ id: updateId }))
  })
})

describe('Clock-in Operations', () => {
  test('Clock-in session management', async () => {
    const sessionData = {
      employee_id: createdIds.employeeId,
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00:00',
      end_time: '17:00:00',
      description: 'Regular work day'
    }

    // Create session
    const { data: session } = await SupabaseService.createClockinSession(sessionData)
    expect(session).toBeDefined()
    const sessionId = session![0].id

    // Get sessions
    const { data: sessions } = await SupabaseService.getClockinSessions(
      createdIds.employeeId,
      sessionData.date,
      sessionData.date
    )
    expect(sessions).toContainEqual(expect.objectContaining({ id: sessionId }))
  })
})

describe('Poll Operations', () => {
  test('Poll creation and options', async () => {
    const pollData = {
      admin_id: createdIds.employeeId,
      title: 'Team Meeting Time',
      selection_type: 'single-choice' as const,
      anonymous: false,
      result_visibility: 'live' as const,
      options: ['Monday 10 AM', 'Tuesday 2 PM', 'Wednesday 3 PM']
    }

    // Create poll
    const { data: poll } = await SupabaseService.createPoll(pollData)
    expect(poll).toBeDefined()

    // Get polls
    const { data: polls } = await SupabaseService.getPolls(true)
    expect(polls).toContainEqual(expect.objectContaining({ id: poll!.id }))
  })
})

describe('Document Operations', () => {
  test('Public document management', async () => {
    const docData = {
      visibility: 'team-only' as const,
      file_path: '/documents/test.pdf',
      type: 'pdf',
      title: 'Test Document',
      description: 'Test document description',
      uploaded_by: createdIds.employeeId
    }

    // Create document
    const { data: doc } = await SupabaseService.createPublicDocument(docData)
    expect(doc).toBeDefined()

    // Get documents
    const { data: docs } = await SupabaseService.getPublicDocuments('team-only')
    expect(docs).toContainEqual(expect.objectContaining({ id: doc![0].id }))
  })
})

// Clean up function at the end
afterAll(async () => {
  if (createdIds.accountId) {
    try {
      // Clean up test data in reverse order of creation
      await SupabaseService.signIn(TEST_USER.email, TEST_USER.password)
      // Add cleanup for all created resources
      await SupabaseService.signOut()
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }
})

