

export enum PERMISSIONS {
    TASKS = 'TASKS',
    MEDITATION = 'MEDITATION',
    ANALYTICS = 'ANALYTICS',
    OWN_MEDITATION_ANALYTICS = 'OWN_MEDITATION_ANALYTICS',
    OWN_TASK_ANALYTICS = 'OWN_TASK_ANALYTICS',
}

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLES = {
    ADMIN: ALL_PERMISSIONS,   
    USER: [ PERMISSIONS.MEDITATION],
    TEAM_MEMBER: [PERMISSIONS.TASKS, PERMISSIONS.MEDITATION, PERMISSIONS.OWN_MEDITATION_ANALYTICS, PERMISSIONS.OWN_TASK_ANALYTICS],
} as const;



