# 🗺️ Student Atlas — Feature Roadmap & Expansion Guide
> **High-Impact, Context-Aware Feature Proposals Built on Existing App Capabilities**

---

## 📌 Executive Summary

**Student Atlas** already has strong, working pillars:
- **Academic Core**: CGPA/GPA Tracker, Course units, and What-If GPA Simulator.
- **Catch Up**: Course syllabus progress tracker, chapter status toggles, visual progress bars.
- **Community & Social**: Discussion boards, messaging, announcements, and unread counters.
- **Resource Management**: File upload system, image compression, and resource lockers.
- **Web & Mobile Shell**: Standalone PWA, mobile-friendly design, and Vercel cloud hosting.

The proposals below are **not generic ideas**—they are specifically engineered to build directly on top of your existing code and data models, giving students an indispensable companion app.

---

## 1. 🚀 Supercharging the "Catch Up" Engine

The Catch Up feature is your standout differentiator. Here is how to evolve it from a manual checklist into an intelligent academic assistant:

### A. Exam Countdown & Daily Pace Calculator
* **How it builds on current code**: You already track `total chapters`, `done chapters`, and `pending chapters` in Firestore under `users/{uid}/catchup/{courseId}`.
* **The Feature**: Add an optional "Exam Date" to each course card.
* **The Experience**:
  - The app calculates: *"Exam in 14 days · 6 chapters remaining · You need to cover 1 chapter every 2.3 days to catch up."*
  - Automatically updates daily, showing students whether their current pace is sufficient or if they are falling behind schedule.

### B. Crowd-Sourced Syllabus & Chapter Templates
* **How it builds on current code**: Currently, each student enters their course chapters manually.
* **The Feature**: When one student in CSC 301 adds all 10 chapters, allow them to click **"Share Syllabus"**.
* **The Experience**:
  - Other classmates taking CSC 301 can click **"Import Class Syllabus"** and populate their Catch Up tracker with one click.
  - Eliminates data entry friction for new users.

### C. Spaced Repetition ("Knowledge Decay" Indicator)
* **How it builds on current code**: Each chapter topic already records an `addedAt` timestamp and `status` (`done` / `uncovered`).
* **The Feature**: Track when a chapter was marked `done`. If 14+ days pass without review, the badge subtly transitions to *"Needs Revision"*.
* **The Experience**: Prevents cram-and-forget syndrome by encouraging periodic review before finals.

### D. Integrated Pomodoro Focus Timer for Chapters
* **How it builds on current code**: Inside the Catch Up chapter modal (`#catchup-modal`), add a 25-minute Pomodoro timer button next to any pending chapter.
* **The Feature**: Tapping "Study Chapter" launches a clean focus overlay with subtle ambient background sounds.
* **The Experience**: Once the timer rings, it offers a single tap: *"Mark chapter as covered?"* Linking study time directly to progress.

---

## 2. 🎯 Academic & GPA Intelligence

Your GPA Calculator and "What-If" Simulator are already strong. These features take student guidance to the next level:

### A. Reverse Target GPA Calculator ("What Do I Need to Get?")
* **How it builds on current code**: Currently, the user manually toggles courses and adjusts letter grades to see the simulated result.
* **The Feature**: The student inputs their dream target CGPA (e.g., `4.50` for First Class Honors).
* **The Experience**:
  - The algorithm calculates all possible minimal grade combinations across their registered courses to hit that target.
  - Generates clear guidance: *"To achieve a 4.50 this semester, you need at least 3 A's and 2 B's across your 5 registered courses."*

### B. Continuous Assessment (CA) vs. Exam Split Calculator
* **How it builds on current code**: Currently, courses only store final projected grades. In universities (like Babcock), final grades are split into CA (30–40%) and Final Exam (60–70%).
* **The Feature**: A collapsible breakdown inside the course details modal:
  - Input Midterm/Test score (e.g., `24 / 30`).
  - Input Assignment score (e.g., `8 / 10`).
  - The app automatically calculates: *"You need 38 / 60 in the final exam to secure an 'A'."*

### C. Professional PDF Academic Transcript Generator
* **How it builds on current code**: All completed semesters, course codes, unit hours, letter grades, and GPA history are stored in Firestore.
* **The Feature**: One-click **"Export Academic Summary"** using client-side PDF generation (`jsPDF` or HTML-to-Canvas).
* **The Experience**: Generates a clean, beautifully formatted, branded PDF report of their academic trajectory to share with parents, academic advisers, or scholarship sponsors.

---

## 3. 📅 Daily Campus Companion & Schedule

### A. "Next Class Up" Smart Home Card
* **How it builds on current code**: Built on top of the existing timetable/schedule data in `currentSemester`.
* **The Feature**: A prominent top card on the Home screen that dynamically detects the current day and time:
  - *"Next: CSC 301 · Software Engineering · 10:00 AM - 12:00 PM (Starts in 35 mins) · Room: Block B Hall 4"*.
  - When no more classes remain for the day: *"All classes done for today! 🎉 4 chapters pending in Catch Up"*.

### B. 75% Attendance & Exam-Eligibility Guard
* **How it builds on current code**: Most universities mandate a strict 75% or 80% attendance rate to sit for final exams.
* **The Feature**: A one-tap attendance counter for each course (`Present` / `Absent`).
* **The Experience**:
  - Shows an alert if attendance dips close to the danger zone: *"⚠️ CSC 202 attendance is at 76%. One more missed class will make you ineligible for exams."*

---

## 4. 🤝 Community & Academic Knowledge Exchange

### A. Course Past Questions & Exam Vault
* **How it builds on current code**: Builds directly on your existing file upload server, B2/Catbox integration, and image compression tools.
* **The Feature**: Inside each course screen, add a dedicated **"Past Questions & Notes"** tab.
* **The Experience**:
  - Students can upload, view, and download previous years' exam papers, mid-semester questions, and lecture slides.
  - Community upvoting ensures the highest quality notes rise to the top.

### B. Timetable "Free Slot" Study Buddy Matcher
* **How it builds on current code**: Uses students' stored course schedules.
* **The Feature**: Compare schedule slots with friends or study group members.
* **The Experience**:
  - *"You and 3 classmates are all free on Thursdays between 12 PM and 2 PM. Start a study session?"*

### C. Anonymous Course Advice & Tips
* **How it builds on current code**: Builds on community post feeds and Firestore collections.
* **The Feature**: A *"Tips from Seniors"* section for each course code.
* **The Experience**:
  - Seniors who completed CSC 201 can leave tips: *"Focus on trees and pointers for the mid-sem; the lecturer tests syntax rigorously."*

---

## 5. ⚡ Offline Resilience & Speed Optimizations

### A. Full Offline-First PWA Mode (Service Worker + IndexedDB)
* **How it builds on current code**: You already have a PWA `manifest.json` and standalone iOS/Android Webview support.
* **The Feature**:
  1. Register a Service Worker (`sw.js`) with a Cache-First / Stale-While-Revalidate strategy for all shell files (`dashboard.html`, `index.html`, icons, Ionicons).
  2. Enable `enableIndexedDbPersistence(db)` in Firestore.
* **The Experience**:
  - The app launches instantly in **Airplane Mode** or during poor campus Wi-Fi.
  - GPA, courses, and Catch-Up chapters load from device cache in **under 50 milliseconds**.
  - Any chapters checked off offline automatically sync to the cloud when reconnecting.

### B. Haptic Native Pull-to-Refresh
* **How it builds on current code**: Enhances the mobile touch experience across all screens.
* **The Feature**: Touch gesture handler that smoothly reveals a sleek spinner when pulled down at the top of the screen and revalidates Firestore data without full page reload.

---

## 6. 🏆 Gamification & Retention Drivers

### A. Study Streaks & Weekly Academic Digest
* **The Feature**: Daily check-in streak based on Catch Up progress or study sessions.
* **The Experience**:
  - A weekly Monday morning summary popup: *"Last week you covered 7 chapters and maintained a 5-day streak. You're on track for your 4.20 CGPA goal!"*

### B. Unlockable App Themes & Student Badges
* **The Feature**: Reward academic consistency with custom theme accents (Midnight OLED, Royal Gold, Cyberpunk Emerald, Frost Glass).

---

## 📊 Feature Value vs. Implementation Complexity

| Feature | Target Area | Effort | Impact | Recommended Phase |
| :--- | :--- | :---: | :---: | :---: |
| **Exam Countdown in Catch Up** | Catch Up | 🟢 Low | 🔥 Very High | **Phase 1 (Immediate)** |
| **Reverse Target GPA Calculator** | GPA Simulator | 🟢 Low | 🔥 Very High | **Phase 1 (Immediate)** |
| **Full Offline Persistence (PWA)** | Performance | 🟡 Medium | 🔥 Very High | **Phase 1 (Immediate)** |
| **CA / Midterm Exam Split (What-Do-I-Need)** | GPA / Course | 🟢 Low | ⚡ High | **Phase 1 (Immediate)** |
| **Crowd-Sourced Syllabus Import** | Catch Up | 🟡 Medium | ⚡ High | **Phase 2** |
| **Course Past Questions Vault** | Resources | 🟡 Medium | ⚡ High | **Phase 2** |
| **75% Attendance Guard** | Timetable | 🟡 Medium | ⚡ High | **Phase 2** |
| **Pomodoro Focus Timer** | Catch Up | 🟡 Medium | 💡 Medium | **Phase 3** |
| **Transcript PDF Generator** | GPA | 🟡 Medium | 💡 Medium | **Phase 3** |
| **Study Buddy Matcher** | Community | 🔴 High | 💡 Medium | **Phase 3** |

---
*Roadmap generated for Student Atlas / Kobi's Atlas codebase.*
