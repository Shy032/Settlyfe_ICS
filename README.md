# Getting Started

Follow these steps to set up the project:

## 1. Install `pnpm`

If you don't have `pnpm` installed, run:

```bash
npm install -g pnpm
```

## 2. Install Dependencies

In the project directory, install dependencies:

```bash
pnpm install
```

## 3. Start the Development Server

To start the Next.js development server, run:

```bash
pnpm next dev
```

Or, to start the production server:

```bash
pnpm next start
```

# TODO: Fixing the Project
- Which version of ICS is this?
- Update viewport export error in app/layout.tsx 
- Do we have a log file that records all (meaningful) activity server wide?
- Fix text color on login
- Fix task priority
- Chat float bar position
- Chat UI redesign
- Calendar UI redesign
- Navigation button redesign
- Auto fill clock-in time in calendar, daily update on creation, leader board
- Check and update dependencies for compatibility
- Lint and Update documentation as needed

# TODO: Add New Feature
- credit calculation automation at specific time (admin side)
- document executive decisions (admin side)

# TODO: Design Database
## 1st stage
- account (id, login_email, password_hash, access_level, employee_id)
- employee (id, first_name, last_name, title, role, team_id, department_id, join_date, status, overall_assessment, phone, email, note)
- employee_documents (id, employee_id, type, file_path, upload_date)
- team (id, name, lead_employee_id, parent_team_id)
- department (id, name, head_employee_id)
- weekly_credit_score (id, employee_id, admin_id, week_number, year, effort_credit, outcome_credit, collab_credit, wcs, checkmarks)
- quarter_score (id, employee_id, qs, cumulative_checkmarks，assessment)
- executive_decision (id, admin_id, date, description)
- pto_request (id, employee_id, request_date, start_date, end_date, duration, reasoning, status, approved_by, approved_date)
- task (id, admin_id, title, description, publish_date, due_date, priority, visibility, status, attachment_group_id)
- task_member (id, task_id, employee_id)
- task_attachment (id, attachment_group_id, file_path, file_type, upload_date)
- clockin_session (id, employee_id, date, start_time, end_time, duration, hours, description)
- daily_update (id, employee_id, date, description, task_id, location, screenshot_path)
- announcement (id, title, description, type, image_path, priority, release_time, archived)
- announcement_read (id, announcement_id, employee_id, read)
- poll (id, created_date, admin_id, title, selection_type, anonymous, result_visibility, published)
- poll_option (id, poll_id, option_text, votes)
- poll_response (id, poll_id, poll_option_id, employee_id)
- audit_log (id, timestamp, employee_id, action_type, object_type, object_id, change_summary)

## 2nd stage
- chat (id, created time, status)
- chat member join table (id, employee id, chat id)
- chat message (id, chat id, sender id, time, send status, message)
- document (id, file)
- moment (id, employee id, media, description, visibility, tag, location)