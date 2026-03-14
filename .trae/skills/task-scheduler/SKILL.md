---
name: "task-scheduler"
description: "Manages scheduled tasks and cron jobs for xbrowserai. Invoke when user needs to schedule automated browser tasks, set up recurring operations, or manage task queues."
---

# Task Scheduler Skill

This skill provides comprehensive task scheduling capabilities for xbrowserai.

## Overview

The task scheduler allows you to:
- Schedule one-time tasks
- Set up recurring tasks (cron-like)
- Manage task queues
- Monitor task execution
- Handle task failures and retries

## Task Types

### 1. One-Time Tasks
Execute a task once at a specific time or after a delay.

```javascript
// Schedule a task to run after 5 minutes
await taskScheduler.addTask('check-news', 'node scripts/check-news.js', {
  delay: 5 * 60 * 1000, // 5 minutes in milliseconds
  type: 'once'
});

// Schedule a task for a specific time
await