# Parity & Fixes Implementation Log

## Web App (`web-app`)
1.  **Themes**:
    - Implemented standardized CSS variables for theming in `index.html` and `settings.html`.
    - Added logic to save and apply themes using `localStorage` and `data-theme` attribute.
    - Updated `settings.html` to reflect theme changes instantly.

2.  **Navigation**:
    - Removed standalone "Messages" tab from bottom navigation.
    - Merged "Messages" into "Community" screen as a sub-tab (Feed / Messages).
    - Updated `showScreen` and badge logic to support this structure.

3.  **Notifications**:
    - Updated Community badge to sum up Notifications + Friend Requests + Messages (if needed).
    - Added an inner badge for Messages tab within the Community screen.

4.  **Post Visibility**:
    - `loadCommunityFeed` filters out deleted posts and posts from deleted users.

## Mobile App (`my-app`)
1.  **Post Visibility**:
    - Updated `src/services/socialService.ts` -> `getPosts` to filter out posts where the author no longer exists, ensuring parity with Web logic.

2.  **Parity Confirmation**:
    - Confirmed `CommunityScreen` in Android already supports merged Feed/Messages tabs.
    - Confirmed Themes are handled via `ThemeContext` with compatible logic.
