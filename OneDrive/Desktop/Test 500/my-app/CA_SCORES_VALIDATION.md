# CA Scores Validation Update

## Date: November 26, 2025

### Changes Made

#### 1. **CA Scores Now Required (Not Optional)** ✅

**Previous Behavior**:
- CA scores were labeled as "Optional"
- Users could leave all CA scores empty/zero without any warning
- No guidance on entering predicted scores

**New Behavior**:
- CA scores section is now labeled as required
- Helper text added: "Enter actual or predicted scores"
- Validation added to warn users when all CA scores are zero
- Confirmation dialog prompts users to consider entering predicted scores

---

#### 2. **Zero CA Scores Validation** ✅

**Implementation**:
When a user attempts to save/add a course with all CA scores set to zero, they receive a confirmation dialog:

**Message**: 
> "All CA scores are zero. Are you sure you want to save changes? You can put in predicted scores too."

**Options**:
- **Cancel**: Returns to the form to enter scores
- **Save Anyway** / **Add Anyway**: Proceeds with zero scores

**Applies To**:
- ✅ EditCourseScreen (editing existing courses)
- ✅ AddCourseScreen (adding new courses to current semester)
- ❌ Past semester courses (they only require final grade, not CA scores)

---

### Files Modified

#### 1. **`src/screens/EditCourseScreen.tsx`**

**Changes**:
- Changed section title from "CA Scores (Optional)" to "CA Scores"
- Added helper text: "Enter actual or predicted scores"
- Added `handleSave()` validation for zero CA scores
- Created `proceedWithSave()` helper function to handle the actual save operation
- Added confirmation Alert/dialog when all CA scores are zero

**Key Code**:
```typescript
// Check if all CA scores are zero
const allCAScoresZero = parsedMidSem === 0 && parsedAssignment === 0 && 
                        parsedQuiz === 0 && parsedAttendance === 0;

if (allCAScoresZero) {
  Alert.alert(
    'CA Scores are Zero',
    'All CA scores are zero. Are you sure you want to save changes? You can put in predicted scores too.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save Anyway', onPress: confirmSave },
    ]
  );
  return;
}
```

---

#### 2. **`src/screens/AddCourseScreen.tsx`**

**Changes**:
- Changed section title from "CA Scores (Optional)" to "CA Scores"
- Added helper text: "Enter actual or predicted scores"
- Added `helperText` style to StyleSheet
- Added validation in `handleAdd()` for zero CA scores (current semester only)
- Created `proceedWithAdd()` helper function to handle the actual add operation
- Added confirmation Alert when all CA scores are zero

**Key Code**:
```typescript
// Check if all CA scores are zero for current semester
if (!isPastSemester) {
  const allCAScoresZero = parsedMidSem === 0 && parsedAssignment === 0 && 
                          parsedQuiz === 0 && parsedAttendance === 0 && 
                          parsedExamScore === 0;

  if (allCAScoresZero) {
    Alert.alert(
      'CA Scores are Zero',
      'All CA scores are zero. Are you sure you want to add this course? You can put in predicted scores too.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Anyway', onPress: () => proceedWithAdd(...) },
      ]
    );
    return;
  }
}
```

---

### User Experience Flow

#### **Editing a Course**:
1. User opens Edit Course screen
2. User sees "CA Scores" section with helper text
3. User modifies course details
4. User taps "Save Changes"
5. **If all CA scores are zero**:
   - Alert appears with warning message
   - User can cancel to enter scores or proceed anyway
6. **If CA scores have values**:
   - Course saves immediately without warning

#### **Adding a Course (Current Semester)**:
1. User opens Add Course screen
2. User sees "CA Scores" section with helper text
3. User fills in course details
4. User taps "Add Course"
5. **If all CA scores are zero**:
   - Alert appears with warning message
   - User can cancel to enter scores or proceed anyway
6. **If CA scores have values**:
   - Course adds immediately without warning

#### **Adding a Course (Past Semester)**:
1. User opens Add Course screen
2. User only sees "Final Grade" selection (no CA scores)
3. User selects final grade and taps "Add Course"
4. Course adds immediately (no CA validation needed)

---

### Benefits

1. **Better Data Quality**: Encourages users to enter actual or predicted CA scores
2. **Prevents Accidents**: Warns users if they forgot to enter scores
3. **Flexibility**: Still allows saving with zero scores if intentional
4. **Clear Guidance**: Helper text explains that predicted scores are acceptable
5. **Consistent UX**: Same behavior for both adding and editing courses

---

### Testing Checklist

#### Edit Course - Zero CA Scores
- [x] Open course with zero CA scores
- [x] Attempt to save without changing scores
- [x] Verify warning dialog appears
- [x] Click "Cancel" - returns to form
- [x] Click "Save Anyway" - saves successfully

#### Edit Course - Non-Zero CA Scores
- [x] Open course with some CA scores
- [x] Modify scores
- [x] Save changes
- [x] Verify no warning dialog appears
- [x] Verify changes save successfully

#### Add Course - Zero CA Scores (Current Semester)
- [x] Create new course in current semester
- [x] Leave all CA scores at zero
- [x] Attempt to add course
- [x] Verify warning dialog appears
- [x] Click "Cancel" - returns to form
- [x] Click "Add Anyway" - adds successfully

#### Add Course - Non-Zero CA Scores (Current Semester)
- [x] Create new course in current semester
- [x] Enter some CA scores
- [x] Add course
- [x] Verify no warning dialog appears
- [x] Verify course adds successfully

#### Add Course - Past Semester
- [x] Create new course in past semester
- [x] Select final grade
- [x] Add course
- [x] Verify no CA score validation (not applicable)
- [x] Verify course adds successfully

---

### Technical Notes

**Platform Support**:
- ✅ Android (native Alert)
- ✅ iOS (native Alert)
- ✅ Web (window.confirm fallback)

**Validation Logic**:
- Checks if ALL CA scores equal zero
- Uses parsed float values (handles empty strings as 0)
- Only applies to current semester courses
- Past semester courses skip CA validation

**Code Organization**:
- Separated validation logic from save/add logic
- Created helper functions (`proceedWithSave`, `proceedWithAdd`)
- Maintains clean separation of concerns
- Easy to modify validation rules in the future

---

## Summary

CA scores are now treated as required fields with intelligent validation. Users are prompted to enter actual or predicted scores, and receive a friendly warning if all scores are zero. This improves data quality while maintaining flexibility for edge cases.

The implementation is consistent across both adding and editing courses, providing a seamless user experience throughout the app.
