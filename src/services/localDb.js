/**
 * localDb.js — Offline-first data service for StudyHub.
 * 
 * All data is namespaced per-user using their unique ID.
 * This prevents cross-user data leakage on a shared device.
 * 
 * Key Schema:
 *  - studyhub_users           -> array of all registered users (credentials)
 *  - studyhub_current_user    -> the currently logged-in user object
 *  - studyhub_{userId}_tasks
 *  - studyhub_{userId}_activities
 *  - studyhub_{userId}_materials
 *  - studyhub_{userId}_goals
 *  - studyhub_{userId}_notes
 */

const PREFIX = 'studyhub_';

// ─── Raw Storage Helpers ───────────────────────────────────────────────────
const lsGet = (key, fallback = null) => {
    try {
        const val = localStorage.getItem(PREFIX + key);
        return val !== null ? JSON.parse(val) : fallback;
    } catch {
        return fallback;
    }
};

const lsSet = (key, value) => {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
        console.error('localStorage write failed:', e);
    }
};

const lsRemove = (key) => localStorage.removeItem(PREFIX + key);

// ─── ID Generator ──────────────────────────────────────────────────────────
const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// ─── Authentication ────────────────────────────────────────────────────────

/**
 * Register a new user. Stores a hashed-like key (btoa) to avoid plaintext passwords.
 * Returns the new user object.
 */
export const registerUser = ({ name, college = '', email, password }) => {
    const users = lsGet('users', []);
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error('An account with this email already exists.');

    const newUser = {
        _id: generateId(),
        name,
        college,
        email: email.toLowerCase(),
        // Simple obfuscation — NOT cryptographic, but sufficient for offline local storage
        _pw: btoa(password),
        role: 'user',
        studyHours: 0,
        codingHours: 0,
        watchingHours: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        avatar: null,
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    lsSet('users', users);

    const { _pw, ...safeUser } = newUser;
    lsSet('current_user', safeUser);
    return safeUser;
};

/**
 * Login an existing user. Returns safe user object (no password).
 */
export const loginUser = ({ email, password, isAdminLogin = false }) => {
    const users = lsGet('users', []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found with this email.');
    if (atob(user._pw) !== password) throw new Error('Incorrect password.');
    if (isAdminLogin && user.role !== 'admin') throw new Error('Not authorized as an admin.');

    const { _pw, ...safeUser } = user;
    lsSet('current_user', safeUser);
    return safeUser;
};

/**
 * Get the currently logged-in user from localStorage.
 */
export const getCurrentUser = () => lsGet('current_user', null);

/**
 * Log out the current user.
 */
export const logoutUser = () => lsRemove('current_user');

/**
 * Get all registered users (for internal lookup/admin use).
 * Use this instead of direct localStorage access to avoid double-prefix bugs.
 */
export const getUsers = () => lsGet('users', []);

/**
 * Save all users array (used by password reset).
 */
export const saveUsers = (users) => lsSet('users', users);

/**
 * Manually set the current logged-in user in localStorage (used by Google login).
 */
export const setCurrentUser = (safeUser) => lsSet('current_user', safeUser);

/**
 * Update the profile of the currently logged-in user.
 */
export const updateUserProfile = (userId, updates) => {
    const users = lsGet('users', []);
    const idx = users.findIndex(u => u._id === userId);
    if (idx === -1) throw new Error('User not found.');

    // Don't allow overwriting internal fields
    const { _pw, _id, email, role, createdAt, ...allowedUpdates } = updates;
    users[idx] = { ...users[idx], ...allowedUpdates };
    lsSet('users', users);

    const { _pw: pw, ...safeUser } = users[idx];
    lsSet('current_user', safeUser);
    return safeUser;
};

/**
 * Add study/coding/watching hours to the current user and manage streaks.
 */
export const addStudyHours = (userId, hours, type = 'Study') => {
    const users = lsGet('users', []);
    const idx = users.findIndex(u => u._id === userId);
    if (idx === -1) return null;

    const today = new Date().toISOString().slice(0, 10);
    const user = users[idx];

    if (type === 'Coding') user.codingHours = (user.codingHours || 0) + hours;
    else if (type === 'Watching') user.watchingHours = (user.watchingHours || 0) + hours;
    else user.studyHours = (user.studyHours || 0) + hours;

    // Streak logic
    if (user.lastActivityDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (user.lastActivityDate === yStr) {
            user.currentStreak = (user.currentStreak || 0) + 1;
        } else {
            user.currentStreak = 1;
        }
        user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
        user.lastActivityDate = today;
    }

    users[idx] = user;
    lsSet('users', users);
    const { _pw, ...safeUser } = user;
    lsSet('current_user', safeUser);
    return safeUser;
};

// ─── User-Scoped Key Helper ────────────────────────────────────────────────
const userKey = (userId, entity) => `${userId}_${entity}`;

// ─── Tasks ─────────────────────────────────────────────────────────────────

export const getTasks = (userId) => lsGet(userKey(userId, 'tasks'), []);

export const saveTasks = (userId, tasks) => lsSet(userKey(userId, 'tasks'), tasks);

export const addTask = (userId, { title, description = '', pdfUrl = '', fileName = '', dueDate = '', startTime = '', endTime = '', quadrant = null }) => {
    const tasks = getTasks(userId);
    const newTask = {
        _id: generateId(),
        title,
        description,
        pdfUrl,
        fileName,
        dueDate,
        startTime,
        endTime,
        quadrant,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    saveTasks(userId, tasks);
    return newTask;
};

export const updateTask = (userId, id, updates) => {
    const tasks = getTasks(userId);
    const idx = tasks.findIndex(t => t._id === id);
    if (idx === -1) throw new Error('Task not found.');
    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    saveTasks(userId, tasks);
    return tasks[idx];
};

export const deleteTask = (userId, id) => {
    const tasks = getTasks(userId).filter(t => t._id !== id);
    saveTasks(userId, tasks);
};

// ─── Activities ────────────────────────────────────────────────────────────

const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getActivities = (userId) => lsGet(userKey(userId, 'activities'), []);

export const saveActivities = (userId, activities) => lsSet(userKey(userId, 'activities'), activities);

export const addActivity = (userId, activityData) => {
    const activities = getActivities(userId);
    const newActivity = {
        _id: generateId(),
        ...activityData,
        localDate: activityData.localDate || getLocalDateStr(),
        createdAt: new Date().toISOString(),
    };
    activities.unshift(newActivity);
    saveActivities(userId, activities);
    return newActivity;
};

export const deleteActivity = (userId, id) => {
    const activities = getActivities(userId).filter(a => a._id !== id);
    saveActivities(userId, activities);
};

export const getTodayActivities = (userId, localDate) => {
    const date = localDate || getLocalDateStr();
    return getActivities(userId).filter(a => a.localDate === date);
};

export const getMonthlySummary = (userId, localDate) => {
    const date = localDate || getLocalDateStr();
    const [year, month] = date.split('-');
    const activities = getActivities(userId).filter(a => {
        if (!a.localDate) return false;
        const [y, m] = a.localDate.split('-');
        return y === year && m === month;
    });

    const summary = { studyHrs: 0, codingHrs: 0, watchingHrs: 0 };
    const allActivities = getActivities(userId);
    const totalSummary = { totalStudyHrs: 0, totalCodingHrs: 0, totalWatchingHrs: 0 };

    activities.forEach(a => {
        const hrs = (a.minutes || 0) / 60;
        if (a.type === 'Coding') summary.codingHrs += hrs;
        else if (a.type === 'Watching') summary.watchingHrs += hrs;
        else summary.studyHrs += hrs;
    });
    allActivities.forEach(a => {
        const hrs = (a.minutes || 0) / 60;
        if (a.type === 'Coding') totalSummary.totalCodingHrs += hrs;
        else if (a.type === 'Watching') totalSummary.totalWatchingHrs += hrs;
        else totalSummary.totalStudyHrs += hrs;
    });

    return { ...summary, ...totalSummary };
};

// ─── Goals ─────────────────────────────────────────────────────────────────

const DEFAULT_GOALS = { codingGoalHrs: 100, watchingGoalHrs: 50, studyGoalHrs: 100 };

export const getGoals = (userId) => lsGet(userKey(userId, 'goals'), DEFAULT_GOALS);

export const saveGoals = (userId, goals) => lsSet(userKey(userId, 'goals'), goals);

// ─── Materials ─────────────────────────────────────────────────────────────

export const getMaterials = (userId) => lsGet(userKey(userId, 'materials'), []);

export const saveMaterials = (userId, materials) => lsSet(userKey(userId, 'materials'), materials);

export const addMaterial = (userId, { title, description, fileUrl, fileType, fileName }) => {
    const materials = getMaterials(userId);
    const newMaterial = {
        _id: generateId(),
        title,
        description,
        fileUrl,
        fileType,
        fileName,
        createdAt: new Date().toISOString(),
    };
    materials.unshift(newMaterial);
    saveMaterials(userId, materials);
    return newMaterial;
};

export const updateMaterial = (userId, id, updates) => {
    const materials = getMaterials(userId);
    const idx = materials.findIndex(m => m._id === id);
    if (idx === -1) throw new Error('Material not found.');
    materials[idx] = { ...materials[idx], ...updates };
    saveMaterials(userId, materials);
    return materials[idx];
};

export const deleteMaterial = (userId, id) => {
    const materials = getMaterials(userId).filter(m => m._id !== id);
    saveMaterials(userId, materials);
};

// ─── Notes ─────────────────────────────────────────────────────────────────

export const getNotes = (userId) => lsGet(userKey(userId, 'notes'), []);

export const saveNotes = (userId, notes) => lsSet(userKey(userId, 'notes'), notes);

export const addNote = (userId, { title, content }) => {
    const notes = getNotes(userId);
    const newNote = {
        _id: generateId(),
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    saveNotes(userId, notes);
    return newNote;
};

export const updateNote = (userId, id, updates) => {
    const notes = getNotes(userId);
    const idx = notes.findIndex(n => n._id === id);
    if (idx === -1) throw new Error('Note not found.');
    notes[idx] = { ...notes[idx], ...updates, updatedAt: new Date().toISOString() };
    saveNotes(userId, notes);
    return notes[idx];
};

export const deleteNote = (userId, id) => {
    const notes = getNotes(userId).filter(n => n._id !== id);
    saveNotes(userId, notes);
};
