# Kobi's Atlas - Selected Features

## 1. 🎯 Long-Term Goal Back-Calculation ("Target CGPA Pathfinder")
*   **The Problem:** Most GPA simulators only let you play with the *current* semester. Students actually want to know: *"How do I recover from a bad semester to graduate with my target class?"*
*   **The Standout Solution:** A multi-semester target pathfinder.
    *   The user sets a target graduation CGPA (e.g., `4.50` for First Class).
    *   The system calculates the remaining credit units needed to graduate.
    *   It dynamically tells the student: *"To hit your goal, you need to average a **4.62 GPA** over your remaining 4 semesters."*
    *   If a student enters their actual grades at the end of a semester and falls short (or exceeds), the pathfinder automatically recalculates and adjusts the targets for the remaining semesters.

## 2. 📉 Real-Time Grade Target Tracker & "CA Burndown Chart"
*   **The Problem:** Students don't know if they can still get an 'A' after scoring low on a test, or they find it hard to visualize what they need on the final exam.
*   **The Standout Solution:** A visual grade projection bar inside the Course Detail screen.
    *   **Secure vs. Lost Marks:** Visualize marks as a stack (e.g., Out of 100 total marks: 15 marks secured, 5 marks lost, 80 marks remaining).
    *   **Live Probability Indicator:** Under each target grade, show a status:
        *   🟢 **A (80%+)**: *Highly Achievable* (Needs 65/80 marks on the remaining assessments).
        *   🟡 **B (60%+)**: *Guaranteed* (Even if you get 45/80 on remaining assessments).
        *   🔴 **A (80%+)**: *Impossible* (If the user has already lost more than 20 marks total, the app locks the 'A' option and highlights 'B' as the new maximum ceiling).
