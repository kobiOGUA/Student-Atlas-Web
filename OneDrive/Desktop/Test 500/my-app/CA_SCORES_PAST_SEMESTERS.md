# CA Scores for Past Semesters Update

## Date: November 26, 2025

### Change Summary

Updated the **AddCourseScreen** to allow CA score input for **both past and current semester courses**.

---

### Previous Behavior

**Past Semester Courses**:
- Only showed "Final Grade" selector
- CA scores were automatically set to 0
- No option to enter CA breakdown

**Current Semester Courses**:
- Showed "Target Grade" selector
- Showed CA scores input fields
- CA scores were required (with zero validation)

---

### New Behavior

**Past Semester Courses**:
- ✅ Shows "Final Grade *" selector (required)
- ✅ Shows CA scores input fields (optional)
- ✅ Helper text: "Enter if you have your CA breakdown"
- ✅ No zero validation (truly optional)
- ✅ CA scores are saved if entered

**Current Semester Courses**:
- ✅ Shows "Target Grade" selector
- ✅ Shows CA scores input fields
- ✅ Helper text: "Enter actual or predicted scores"
- ✅ Zero validation active (warns if all zeros)
- ✅ CA scores are saved

---

### UI Changes

#### Past Semester Form Structure:
```
Course Name *
Course Code *
Unit Hours *
Final Grade * [A] [B] [C] [D] [E] [F]

CA Scores (Optional)
Enter if you have your CA breakdown

Mid Semester (0-15)
Assignment (0-10)
Quiz (0-10)
Attendance (0-5)
Exam Score (0-60)

Difficulty (1-5)
[Add Course]
```

#### Current Semester Form Structure:
```
Course Name *
Course Code *
Unit Hours *
Target Grade [A] [B] [C]

CA Scores
Enter actual or predicted scores

Mid Semester (0-15)
Assignment (0-10)
Quiz (0-10)
Attendance (0-5)
Exam Score (0-60)

Difficulty (1-5)
[Add Course]
```

---

### Code Changes

**File**: `src/screens/AddCourseScreen.tsx`

#### 1. **UI Rendering**
- Moved CA scores input fields outside the conditional block
- Now renders for both past and current semesters
- Dynamic section title: "CA Scores (Optional)" for past, "CA Scores" for current
- Dynamic helper text based on semester type

#### 2. **Data Handling**
- CA scores are now always included in the course object
- Uses parsed values for both semester types
- Removed the hardcoded zero values for past semesters

**Before**:
```typescript
...(isPastSemester
  ? {
    grade: finalGrade,
    caScores: { midSemester: 0, assignment: 0, quiz: 0, attendance: 0, examScore: 0 },
  }
  : {
    targetGrade,
    caScores: { midSemester: parsedMidSem, ... },
  })
```

**After**:
```typescript
caScores: {
  midSemester: parsedMidSem,
  assignment: parsedAssignment,
  quiz: parsedQuiz,
  attendance: parsedAttendance,
  examScore: parsedExamScore,
},
...(isPastSemester
  ? { grade: finalGrade }
  : { targetGrade })
```

---

### Validation Behavior

#### **Current Semester**:
- ✅ Zero validation **ACTIVE**
- If all CA scores are zero → Shows warning dialog
- User can cancel or proceed

#### **Past Semester**:
- ❌ Zero validation **DISABLED**
- CA scores are truly optional
- No warning if all zeros
- User can leave blank or enter values

---

### Use Cases

#### **Use Case 1: Past Semester with CA Breakdown**
Student has their CA scores from a completed course:
1. Select "Past Semester"
2. Enter course details
3. Select final grade (e.g., "A")
4. **Enter CA scores** (e.g., Mid: 14, Assignment: 9, Quiz: 8, Attendance: 5, Exam: 55)
5. Add course
6. ✅ Course saved with both final grade and CA breakdown

#### **Use Case 2: Past Semester without CA Breakdown**
Student only knows their final grade:
1. Select "Past Semester"
2. Enter course details
3. Select final grade (e.g., "B")
4. **Leave CA scores at 0** (optional)
5. Add course
6. ✅ Course saved with final grade only (no warning)

#### **Use Case 3: Current Semester with Predicted Scores**
Student wants to track predicted performance:
1. Select "Current Semester"
2. Enter course details
3. Select target grade (e.g., "A")
4. **Enter predicted CA scores**
5. Add course
6. ✅ Course saved with predictions (no warning)

#### **Use Case 4: Current Semester - Forgot to Enter Scores**
Student accidentally leaves all CA scores at zero:
1. Select "Current Semester"
2. Enter course details
3. Select target grade
4. **Leave CA scores at 0** (forgot to enter)
5. Tap "Add Course"
6. ⚠️ **Warning appears**: "All CA scores are zero..."
7. User can go back and enter scores or proceed anyway

---

### Benefits

1. **Flexibility**: Users can enter CA scores for past semesters if they have them
2. **Data Richness**: More complete historical data for analysis
3. **Consistency**: Same input fields for both semester types
4. **User Choice**: Past semester CA scores are truly optional (no validation)
5. **Smart Validation**: Current semester still has zero-check to prevent accidents

---

### Testing Checklist

#### Past Semester - With CA Scores
- [x] Add course to past semester
- [x] Enter final grade
- [x] Enter CA scores (non-zero values)
- [x] Verify no warning appears
- [x] Verify course saves with CA scores

#### Past Semester - Without CA Scores
- [x] Add course to past semester
- [x] Enter final grade
- [x] Leave CA scores at zero
- [x] Verify no warning appears
- [x] Verify course saves with zero CA scores

#### Current Semester - With CA Scores
- [x] Add course to current semester
- [x] Enter target grade
- [x] Enter CA scores (non-zero values)
- [x] Verify no warning appears
- [x] Verify course saves correctly

#### Current Semester - Without CA Scores
- [x] Add course to current semester
- [x] Enter target grade
- [x] Leave CA scores at zero
- [x] Verify warning appears
- [x] Test "Cancel" - returns to form
- [x] Test "Add Anyway" - saves course

---

## Summary

The AddCourseScreen now provides a unified interface for entering courses in both past and current semesters, with CA scores available for both. The key difference is:

- **Past Semesters**: CA scores are optional (no validation)
- **Current Semesters**: CA scores have zero-check validation

This gives users maximum flexibility while still providing helpful guidance for current semester courses.
