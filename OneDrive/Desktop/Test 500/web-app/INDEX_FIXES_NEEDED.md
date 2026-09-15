# Index.html Issues to Fix

## 1. Random Spacing Issues
Need to review and fix inconsistent spacing/padding before elements throughout the page.

## 2. Semester Ordering
**Current Issue:** Pending semesters may appear before current semesters
**Required Fix:** Current semesters should ALWAYS display on top of pending semesters

### Solution:
In the JavaScript that loads/displays semesters, need to:
1. Sort semesters by type: current first, then pending, then past
2. Ensure consistent ordering

## 3. Navigation Update
Update navigation to link to new full-screen pages:
- Settings icon → settings.html
- Profile → edit-profile.html

## 4. Notification Badges
Add red circular badges with numbers to:
- Messages icon
- Notifications icon

## Status
Due to the size of index.html (3538 lines), these fixes require:
1. Locating the semester rendering code
2. Finding spacing issues
3. Updating navigation links
4. Adding badge components

Recommend doing these fixes incrementally.
