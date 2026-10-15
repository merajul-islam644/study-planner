# Study Planner — build plan

Feature being built this run: **T02–T16** (onboarding, subjects, dashboard,
sessions, planner, assignments, exams, calendar, goals, progress,
notifications, notes, resources, flashcards, search, settings).

Data model is Blocks Data (`blocks-data-gateway-configuration`,
`blocks-data-gateway-crud`). All records are private to the signed-in student.
History on every subject/topic/assignment/exam/session/goal/flashcard is a
`ChangeLog` schema. Notifications and reminders are Blocks Data records
(`blocks-notifier` considered; Data records chosen — see Assumptions).

## Branding & shell
- [x] Extend sidebar/bottom nav to all sections (this app's shell)
- [x] Dashboard / home layout shell with two columns (no skill)
- [x] Localisation dictionary for all screens (blocks-localization-implementation)

## Data model & access rules
- [x] Define Subject, Topic schemas (blocks-data-gateway-configuration)
- [x] Define Assignment, Task, Exam schemas (blocks-data-gateway-configuration)
- [x] Define StudySession, Goal, CalendarEvent schemas (blocks-data-gateway-configuration)
- [x] Define Note, Resource, Flashcard schemas (blocks-data-gateway-configuration)
- [x] Define Notification, Reminder, ChangeLog, Profile schemas (blocks-data-gateway-configuration)
- [x] Push schemas, apply per-user access rules, reload (blocks-data-gateway-configuration)

## Onboarding (T02)
- [x] Five-step onboarding wizard with academic details (no skill)
- [x] Step 3 add subjects with code suggestion and counter (no skill)
- [x] Step 4 study preferences with 2h/14h defaults (no skill)
- [x] Step 5 finish summary with counts and Go to Dashboard (no skill)
- [x] Route new students to onboarding, finish to dashboard (blocks-data-gateway-crud)

## Subjects (T03)
- [x] Subjects grid with topic count, progress, next exam, study time (blocks-data-gateway-crud)
- [x] Subject create/edit/delete with colour and duplicate-name check (blocks-data-gateway-crud)
- [x] Subject detail with topics, progress and sections (blocks-data-gateway-crud)
- [x] Topic add/edit/remove, status choices, detach keeps sessions (blocks-data-gateway-crud)
- [x] Record changes to subjects and topics in history (blocks-data-gateway-crud)

## Dashboard (T04, T09)
- [x] Dashboard header greeting, date, target ring (blocks-data-gateway-crud)
- [x] Four quick-statistic cards (blocks-data-gateway-crud)
- [x] Today's study plan timeline with statuses (blocks-data-gateway-crud)
- [x] Upcoming deadlines list with priority words (blocks-data-gateway-crud)
- [x] Weekly chart with measure switch and text summary (no skill)
- [x] Quick actions create session/assignment/exam/subject (blocks-data-gateway-crud)

## Study sessions & focus (T05)
- [x] Study session form with studies types and validation (blocks-data-gateway-crud)
- [x] Overlap detection with save-anyway prompt (blocks-data-gateway-crud)
- [x] Session statuses and skipped deduction (blocks-data-gateway-crud)
- [x] Focus mode timer with pause/resume and modes (no skill)
- [x] Focus finish reflection and recording minutes (blocks-data-gateway-crud)
- [x] Session history with filters, grouping and Load more (blocks-data-gateway-crud)
- [x] Reminder offsets on sessions (blocks-data-gateway-crud)

## Planner (T06)
- [x] Planner week view with Monday–Sunday, 06:00–23:00 (no skill)
- [x] Day and Month views with day-click panel (no skill)
- [x] Drag and resize sessions with overlap guard (blocks-data-gateway-crud)
- [x] Duplicate and delete session with history (blocks-data-gateway-crud)
- [x] Tasks due today in week view with tick box (blocks-data-gateway-crud)

## Assignments & exams (T07, T08)
- [x] Assignments list with filters and empty state (blocks-data-gateway-crud)
- [x] Assignment form with priority/status validation (blocks-data-gateway-crud)
- [x] Assignment detail with checklist tick-to-complete (blocks-data-gateway-crud)
- [x] Attachment upload up to 25 MB (blocks-data-storage)
- [x] Exams grid with countdown states (blocks-data-gateway-crud)
- [x] Exam form and prep progress over topics (blocks-data-gateway-crud)

## Calendar, goals, progress (T10, T11, T12)
- [x] Calendar with all five event types and type words (blocks-data-gateway-crud)
- [x] Personal event form with end-after-start check (blocks-data-gateway-crud)
- [x] Goals list with progress, statuses, extend deadline (blocks-data-gateway-crud)
- [x] Streaks and milestone badges on profile (blocks-data-gateway-crud)
- [x] Progress dashboard with period switch and charts (blocks-data-gateway-crud)

## Notifications, notes, flashcards (T13, T14, T15)
- [x] Notification bell, inbox, unread count, mark all read (blocks-data-gateway-crud)
- [x] Notification preferences gate dispatch (blocks-data-gateway-crud)
- [x] Reminder generation for sessions/assignments/exams/goals (blocks-data-gateway-crud)
- [x] Notes per record with formatting and tags (blocks-data-gateway-crud)
- [x] Resources with type validation and file size guard (blocks-data-storage)
- [x] Flashcards deck with study mode and mastery (blocks-data-gateway-crud)

## Search & settings (T16)
- [x] Global search grouped by record type (blocks-data-gateway-crud)
- [x] Settings: study preferences, notifications, appearance (blocks-data-gateway-crud)
- [x] Export data, delete account by email confirm (blocks-iam-account)
- [x] Trash with restore within 30 days (blocks-data-gateway-crud)
- [x] Check and build app
