import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export interface AppVersion {
    currentVersion: string;
    minimumVersion: string;
    latestVersion: string;
    updateRequired: boolean;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    updateMessage?: string;
    features?: string[];
    releaseNotes?: string;
}

/**
 * Check app version and maintenance status from Firebase
 */
export async function checkAppVersion(currentAppVersion: string): Promise<AppVersion> {
    try {
        const versionRef = doc(db, 'config', 'version');
        const versionDoc = await getDoc(versionRef);

        if (!versionDoc.exists()) {
            // Return default if no version document exists
            return {
                currentVersion: currentAppVersion,
                minimumVersion: currentAppVersion,
                latestVersion: currentAppVersion,
                updateRequired: false,
                maintenanceMode: false,
            };
        }

        const versionData = versionDoc.data() as AppVersion;

        // Check if update is required
        const updateRequired = compareVersions(currentAppVersion, versionData.minimumVersion) < 0;

        return {
            ...versionData,
            currentVersion: currentAppVersion,
            updateRequired,
        };
    } catch (error) {
        console.error('Error checking app version:', error);
        // Return safe defaults on error
        return {
            currentVersion: currentAppVersion,
            minimumVersion: currentAppVersion,
            latestVersion: currentAppVersion,
            updateRequired: false,
            maintenanceMode: false,
        };
    }
}

/**
 * Compare two version strings (e.g., "1.0.0" vs "1.0.1")
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;

        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
    }

    return 0;
}

/**
 * Get feature flags from Firebase
 */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
    try {
        const flagsRef = doc(db, 'config', 'features');
        const flagsDoc = await getDoc(flagsRef);

        if (!flagsDoc.exists()) {
            return {};
        }

        return flagsDoc.data() as Record<string, boolean>;
    } catch (error) {
        console.error('Error getting feature flags:', error);
        return {};
    }
}
