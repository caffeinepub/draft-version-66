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
export interface JournalEntryActionRequest {
    action: Variant_delete_toggleFavorite;
    entryIdentifier: JournalEntryIdentifier;
}
export interface JournalEntryIdentifier {
    id: bigint;
    user: Principal;
}
export interface MeditationSession {
    minutes: bigint;
    timestamp: bigint;
}
export interface UpdateJournalEntryRequest {
    id: bigint;
    duration: bigint;
    mood: Array<MoodState>;
    reflection: string;
    meditationType: MeditationType;
    energy: EnergyState;
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
export interface AddJournalEntryRequest {
    duration: bigint;
    mood: Array<MoodState>;
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
export enum Variant_delete_toggleFavorite {
    delete_ = "delete",
    toggleFavorite = "toggleFavorite"
}
export interface backendInterface {
    addJournalEntry(request: AddJournalEntryRequest): Promise<JournalEntry>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteRitual(ritualToDelete: Ritual): Promise<void>;
    getAllJournalEntries(user: Principal): Promise<Array<JournalEntry>>;
    getBooks(): Promise<Array<Book>>;
    getCallerFavoriteEntries(): Promise<Array<JournalEntry>>;
    getCallerJournalEntries(): Promise<Array<JournalEntry>>;
    getCallerProgressStats(): Promise<ProgressStats>;
    getCallerSessionRecords(): Promise<Array<MeditationSession>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentUserExportData(): Promise<ExportData>;
    getDailyQuotes(): Promise<Array<string>>;
    getEntryById(entryId: bigint): Promise<JournalEntry | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importData(importData: ImportData, overwrite: boolean): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listCallerRituals(): Promise<Array<Ritual>>;
    performJournalEntryAction(request: JournalEntryActionRequest): Promise<void>;
    recordMeditationSession(session: MeditationSession, _monthlyStats: bigint, _currentStreak: bigint): Promise<ProgressStats>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveRitual(ritual: Ritual): Promise<void>;
    synchronizeJournalEntries(entries: Array<JournalEntry>): Promise<void>;
    updateJournalEntry(request: UpdateJournalEntryRequest): Promise<JournalEntry>;
}
