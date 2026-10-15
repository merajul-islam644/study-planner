import type { BaseRecord } from "../../lib/blocks/data";

// Domain record shapes mirroring the Blocks Data schemas. Every record is
// owned by one student via `ownerId` and soft-deleted via `deletedAt`.

export type Tracked = BaseRecord & {
  ownerId?: string;
  createdBy?: string;
  lastUpdatedBy?: string;
  deletedAt?: string | null;
};

export type Subject = Tracked & {
  name?: string;
  code?: string;
  colour?: string;
  instructor?: string;
  description?: string;
};

export type TopicStatus = "Not Started" | "Learning" | "Reviewed" | "Confident";
export type Difficulty = "Easy" | "Medium" | "Hard";

export type Topic = Tracked & {
  subjectId?: string;
  name?: string;
  status?: TopicStatus;
  difficulty?: Difficulty;
  notes?: string;
};

export type AssignmentPriority = "Low" | "Medium" | "High" | "Critical";
export type AssignmentStatus = "Not Started" | "In Progress" | "Completed" | "Overdue";

export type Assignment = Tracked & {
  subjectId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: AssignmentPriority;
  status?: AssignmentStatus;
  estimatedMinutes?: number;
  notes?: string;
};

export type Task = Tracked & {
  assignmentId?: string;
  title?: string;
  done?: boolean;
  dueDate?: string;
};

export type Exam = Tracked & {
  subjectId?: string;
  name?: string;
  dateTime?: string;
  location?: string;
  topicIds?: string[];
  notes?: string;
};

export type StudyTypes = "Learning" | "Revision" | "Practice" | "Homework" | "Exam Preparation";
export type SessionStatus = "Upcoming" | "In Progress" | "Completed" | "Skipped";

export type StudySession = Tracked & {
  subjectId?: string;
  topicId?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  studyType?: StudyTypes;
  status?: SessionStatus;
  actualMinutes?: number;
  reflection?: string;
  notes?: string;
  reminderOffsetMinutes?: number;
};

export type GoalType = "Study hours" | "Complete topics" | "Assignment score" | "Study streak";
export type GoalStatus = "Active" | "Met" | "Missed";

export type Goal = Tracked & {
  title?: string;
  description?: string;
  type?: GoalType;
  target?: number;
  deadline?: string;
  status?: GoalStatus;
};

export type CalendarEvent = Tracked & {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
};

export type Note = Tracked & {
  title?: string;
  body?: string;
  attachType?: "Subject" | "Topic" | "Assignment" | "Exam" | "StudySession";
  attachId?: string;
  tags?: string[];
};

export type ResourceType = "YouTube Video" | "PDF" | "Website" | "Online Course" | "Document" | "Personal Resource";

export type Resource = Tracked & {
  title?: string;
  type?: ResourceType;
  url?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  subjectId?: string;
  topicId?: string;
  attachType?: string;
  attachId?: string;
  description?: string;
  tags?: string[];
};

export type Flashcard = Tracked & {
  question?: string;
  answer?: string;
  subjectId?: string;
  topicId?: string;
  difficult?: boolean;
  mastered?: boolean;
  difficultCount?: number;
};

export type Notification = Tracked & {
  topic?: string;
  message?: string;
  read?: boolean;
  kind?: string;
  link?: string;
};

export type Reminder = Tracked & {
  refType?: "Study session" | "Assignment" | "Exam" | "Goal" | "custom";
  refId?: string;
  offsetMinutes?: number;
  sent?: boolean;
  title?: string;
};

export type ChangeLog = Tracked & {
  entityType?: string;
  entityId?: string;
  entityName?: string;
  action?: string;
  summary?: string;
  actorName?: string;
};

export type StudentProfile = Tracked & {
  name?: string;
  email?: string;
  profileImageFileId?: string;
  educationLevel?: string;
  institution?: string;
  term?: string;
  academicGoal?: string;
  preferredDays?: string[];
  preferredHours?: string;
  avgSessionMinutes?: number;
  dailyTargetMinutes?: number;
  weeklyTargetMinutes?: number;
  appearance?: string;
  notificationPrefs?: string;
  onboarded?: boolean;
  milestones?: string[];
};

export const SUBJECT_COLOURS = [
  "Teal", "Sky", "Indigo", "Violet", "Rose", "Amber",
  "Emerald", "Cyan", "Slate", "Fuchsia", "Orange", "Lime"
] as const;
