# Full-Screen Settings & Edit Profile Implementation

## Settings Page Structure (from SettingsScreen.tsx)

### Header
- Back button (arrow-back icon)
- Title: "Settings"

### Sections

#### 1. Account Section
- **Edit Profile** button → navigates to ProfileSettings
- **Change PIN** button → navigates to ChangePINUtility

#### 2. Theme Section
- List of theme options:
  - Default
  - Dark
  - Blue
  - Light Pink
  - Light
- Show checkmark on selected theme
- Click to change theme

#### 3. About Section
- App name: "Student Atlas"
- Version: 1.0.0
- Developer: Kobi Oguadinma
- University: Babcock University
- Description
- Story
- Note about Babcock grading system

#### 4. Logout Button
- Red background
- Confirmation dialog

## Edit Profile Page Structure (from ProfileSettingsScreen.tsx)

### Header
- Back button
- Title: "Edit Profile"

### Fields
- **Profile Picture** - Image picker with preview
- **Username** - Text input (alphanumeric + underscores, max 20 chars)
- **Display Name** - Text input
- **Bio** - Text area
- **About Me** - Text area
- **Email** - Read-only display

### Actions
- **Save** button - Validates and saves to Firebase
- **Cancel** button - Goes back

## Implementation Plan

1. Add full-screen page styles to index.html
2. Create Settings page HTML structure
3. Create Edit Profile page HTML structure
4. Add navigation functions
5. Wire up Firebase for data loading/saving
6. Remove old modals
7. Update navigation to show new pages

## Next Steps
Creating the actual HTML/CSS/JS implementation...
