# WEB APP vs ANDROID APP - FEATURE PARITY CHECKLIST

## ✅ VERIFIED FEATURES (Matching Android)

### Dashboard Display
- ✅ Current CGPA calculation
- ⚠️ **ISSUE**: Predicted CGPA should ONLY show if current OR pending semesters exist
- ✅ Three sections: Pending, Current, Past
- ✅ Semester cards show: name, course count, GPA
- ✅ FAB button to add semester
- ✅ Pull to refresh (web: manual refresh)

### Semester Management
- ✅ Two entry methods: Manual vs Quick Add
- ⚠️ **ISSUE**: Quick Add should force type to 'past' (currently allows selection)
- ⚠️ **ISSUE**: Validation missing - only ONE current semester allowed
- ✅ Semester types: current, pending, past
- ✅ Delete semester functionality
- ✅ Navigate to semester detail

### Course Management  
- ⚠️ **CRITICAL**: Field names don't match!
  - Android uses: `name`, `unitHours`
  - Web uses: `title`, `units`
  - **Must fix to access same Firebase data!**
- ⚠️ **MISSING**: Course fields from Android:
  - `id` (string)
  - `difficulty` (1-5)
  - `schedule` (object or null)
  - `examDate` (string or null)
  - `finalScore` (number, optional)
  - `grade` (Grade type, optional)
- ✅ CA Scores structure matches
- ✅ Target grade selection
- ✅ Predicted grade calculation
- ✅ Delete course functionality

### CA Scores & Predictions
- ✅ Mid Semester: 0-15
- ✅ Assignment: 0-10
- ✅ Quiz: 0-10
- ✅ Attendance: 0-5
- ✅ Total CA calculation
- ✅ Required exam score calculation
- ✅ Certainty level (High/Medium/Low)
- ✅ Predicted grade based on CA + target

### GPA Calculations
- ✅ Grade to point conversion (A=5, B=4, C=3, D=2, E=1, F=0)
- ✅ Semester GPA calculation
- ✅ CGPA calculation
- ✅ Predicted CGPA calculation

## ❌ CRITICAL ISSUES TO FIX

### 1. Data Structure Mismatch
**Problem**: Course fields don't match Android app
**Impact**: Web app cannot read existing Android data from Firebase
**Fix Required**:
```javascript
// WRONG (current web version):
const newCourse = {
    title: "...",
    units: 2,
    ...
};

// CORRECT (must match Android):
const newCourse = {
    id: `course_${Date.now()}`,
    name: "...",           // NOT title
    code: "...",
    unitHours: 2,          // NOT units
    targetGrade: "A",
    difficulty: 3,         // REQUIRED
    caScores: {...},
    predictedGrade: "A",
    schedule: null,        // REQUIRED
    examDate: null,        // REQUIRED
    finalScore: undefined, // OPTIONAL
    grade: undefined       // OPTIONAL
};
```

### 2. Predicted CGPA Display Logic
**Problem**: Shows predicted CGPA always
**Correct Logic**: Only show if `currentSemester` OR `pendingSemesters.length > 0`
```javascript
// In dashboard display:
{(currentSemester || pendingSemesters.length > 0) && (
    <div class="stat-card">
        <div class="stat-label">Predicted CGPA</div>
        <div class="stat-value">{predictedCGPA}</div>
    </div>
)}
```

### 3. Current Semester Validation
**Problem**: Allows multiple current semesters
**Fix**: Check before creating
```javascript
if (selectedSemesterType === 'current') {
    const semRef = collection(db, 'users', uid, 'semesters');
    const snapshot = await getDocs(semRef);
    const hasCurrent = snapshot.docs.some(doc => doc.data().type === 'current');
    
    if (hasCurrent) {
        showToast('A current semester already exists!', 'error');
        return;
    }
}
```

### 4. Quick Add Method
**Problem**: Allows type selection
**Fix**: Force type to 'past' for quick add
```javascript
if (method === 'quick') {
    // Always create as 'past' type
    await submitSemester(name, 'past', gpaNum, unitsNum);
}
```

## 📋 ADDITIONAL ANDROID FEATURES TO ADD

### Missing Features
1. **Long press to delete** - Currently only button delete
2. **Refresh control** - Pull to refresh on mobile
3. **Semester detail header** - Should show type badge
4. **Course difficulty rating** - Stars display
5. **Exam date display** - If set
6. **Schedule display** - If set
7. **Final score vs predicted** - Show both if final exists

### Nice-to-Have Android Features
- Swipe gestures
- Haptic feedback
- Animations on add/delete
- Empty state illustrations
- Loading skeletons

## 🔧 IMMEDIATE ACTION ITEMS

### Priority 1 (CRITICAL - Breaks Firebase compatibility)
1. Fix course field names: `title` → `name`, `units` → `unitHours`
2. Add missing required fields: `id`, `difficulty`, `schedule`, `examDate`

### Priority 2 (Important - Logic errors)
3. Fix predicted CGPA display condition
4. Add current semester validation
5. Force quick add to 'past' type

### Priority 3 (Polish)
6. Add long-press delete
7. Add type badges to semester cards
8. Display course difficulty
9. Show exam dates

## 🎯 VERIFICATION STEPS

To verify complete parity:
1. Create semester in Android app
2. Add courses in Android app
3. Open web app
4. Verify all data displays correctly
5. Edit CA scores in web app
6. Verify changes sync to Android app

## 📊 CURRENT STATUS

**Data Compatibility**: ❌ BROKEN (field name mismatch)
**Feature Completeness**: 85%
**Logic Accuracy**: 90%
**UI Parity**: 95%

**Overall**: 🟡 NEEDS CRITICAL FIXES before production use
