import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ExportData {
    journalEntries: Array<JournalEntry>;
    progressStats: ProgressStats;
    sessionRecords: Array<MeditationSession>;
    userProfile?: UserProfile;
}
export interface Book {
    title: string;
    goodreadsLink: string;
    icon: string;
    tags: Array<string>;
    description: string;
    author: string;
}
export interface ProgressStats {
    monthlyMinutes: bigint;
    rank: string;
    currentStreak: bigint;
    totalMinutes: bigint;
}
export interface MeditationSession {
    minutes: bigint;
    timestamp: bigint;
}
export interface JournalEntry {
    id: bigint;
    duration: bigint;
    mood: Array<MoodState>;
    user: Principal;
    isFavorite: boolean;
    timestamp: bigint;
    reflection: string;
    meditationType: MeditationType;
    energy: EnergyState;
}
export interface Ritual {
    duration: bigint;
    ambientSoundVolume: bigint;
    timestamp: bigint;
    ambientSound: string;
    meditationType: MeditationType;
}
export interface ImportData {
    journalEntries: Array<JournalEntry>;
    progressStats: ProgressStats;
    sessionRecords: Array<MeditationSession>;
    userProfile?: UserProfile;
}
export interface JournalEntryInput {
    duration: bigint;
    mood: Array<MoodState>;
    isFavorite: boolean;
    timestamp: bigint;
    reflection: string;
    meditationType: MeditationType;
    energy: EnergyState;
}
export interface UserProfile {
    name: string;
    email?: string;
    avatar?: ExternalBlob;
}
export enum EnergyState {
    tired = "tired",
    energized = "energized",
    restless = "restless",
    balanced = "balanced"
}
export enum MeditationType {
    ifs = "ifs",
    metta = "metta",
    mindfulness = "mindfulness",
    visualization = "visualization"
}
export enum MoodState {
    sad = "sad",
    anxious = "anxious",
    happy = "happy",
    calm = "calm",
    neutral = "neutral"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createJournalEntry(entry: JournalEntryInput): Promise<JournalEntry>;
    deleteJournalEntry(entryId: bigint): Promise<void>;
    deleteRitual(ritualToDelete: Ritual): Promise<void>;
    editJournalEntry(entry: JournalEntryInput): Promise<JournalEntry>;
    getBooks(): Promise<Array<Book>>;
    getCallerJournalEntries(): Promise<Array<JournalEntry>>;
    getCallerProgressStats(): Promise<ProgressStats>;
    getCallerSessionRecords(): Promise<Array<MeditationSession>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentUserExportData(): Promise<ExportData>;
    getDailyQuotes(): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importData(importData: ImportData): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listCallerRituals(): Promise<Array<Ritual>>;
    recordMeditationSession(session: MeditationSession, _monthlyStats: bigint, _currentStreak: bigint): Promise<ProgressStats>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveRitual(ritual: Ritual): Promise<void>;
    toggleFavoriteEntry(entryId: bigint): Promise<void>;
    updateJournalEntry(entryId: bigint, entry: JournalEntryInput): Promise<JournalEntry>;
}
