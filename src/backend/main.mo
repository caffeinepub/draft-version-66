import Nat "mo:core/Nat";
import Map "mo:core/Map";
import List "mo:core/List";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  type Book = {
    title : Text;
    author : Text;
    description : Text;
    goodreadsLink : Text;
    tags : [Text];
    icon : Text;
  };

  type MeditationType = {
    #mindfulness;
    #metta;
    #visualization;
    #ifs;
  };

  type MoodState = {
    #calm;
    #anxious;
    #neutral;
    #happy;
    #sad;
  };

  type EnergyState = {
    #tired;
    #energized;
    #balanced;
    #restless;
  };

  type JournalEntry = {
    id : Nat;
    user : Principal;
    meditationType : MeditationType;
    duration : Nat;
    mood : [MoodState];
    energy : EnergyState;
    reflection : Text;
    timestamp : Int;
    isFavorite : Bool;
  };

  type UserProfile = {
    name : Text;
    email : ?Text;
    avatar : ?Storage.ExternalBlob;
  };

  type MeditationSession = {
    minutes : Nat;
    timestamp : Int;
  };

  type ProgressStats = {
    totalMinutes : Nat;
    currentStreak : Nat;
    monthlyMinutes : Nat;
    rank : Text;
  };

  type ProgressStore = {
    currentStreak : Nat;
    totalMinutes : Nat;
    sessions : List.List<MeditationSession>;
  };

  type ImportData = {
    journalEntries : [JournalEntry];
    sessionRecords : [MeditationSession];
    progressStats : ProgressStats;
    userProfile : ?UserProfile;
  };

  type Ritual = {
    meditationType : MeditationType;
    duration : Nat;
    ambientSound : Text;
    ambientSoundVolume : Nat;
    timestamp : Int;
  };

  // Updated book list (no buddhism/spirituality)
  let books = List.fromArray<Book>([
    {
      title = "Ten Percent Happier";
      author = "Dan Harris";
      description = "A personal journey into mindfulness meditation, offering practical tips and insights for skeptics.";
      goodreadsLink = "https://www.goodreads.com/book/show/18505796-10-happier";
      tags = ["Mindfulness"];
      icon = "focus";
    },
    {
      title = "Real Happiness";
      author = "Sharon Salzberg";
      description = "An accessible guide introducing practical meditation techniques and principles for happiness.";
      goodreadsLink = "https://www.goodreads.com/book/show/8911865-real-happiness";
      tags = ["Happiness"];
      icon = "book";
    },
    {
      title = "Wherever You Go, There You Are";
      author = "Jon Kabat-Zinn";
      description = "A classic introduction to mindfulness meditation and its practical application in daily life.";
      goodreadsLink = "https://www.goodreads.com/book/show/39080.Wherever_You_Go_There_You_Are";
      tags = ["Mindful Living"];
      icon = "focus";
    },
    {
      title = "The Power of Now";
      author = "Eckhart Tolle";
      description = "A guide focused on present moment awareness and the benefits of mindful living.";
      goodreadsLink = "https://www.goodreads.com/book/show/6708.The_Power_of_Now";
      tags = ["Mindfulness"];
      icon = "focus";
    },
    {
      title = "The Headspace Guide to Meditation and Mindfulness";
      author = "Andy Puddicombe";
      description = "A practical, accessible guide to developing and maintaining a daily meditation practice.";
      goodreadsLink = "https://www.goodreads.com/book/show/16248108-get-some-headspace";
      tags = ["Mindfulness"];
      icon = "focus";
    },
    {
      title = "Waking Up";
      author = "Sam Harris";
      description = "An exploration of meditation, mindfulness, and conscious awareness from a scientific perspective.";
      goodreadsLink = "https://www.goodreads.com/book/show/18774981-waking-up";
      tags = ["Mindfulness"];
      icon = "focus";
    },
    {
      title = "Mindfulness for Beginners";
      author = "Jon Kabat-Zinn";
      description = "A practical introduction to mindfulness techniques and their everyday benefits.";
      goodreadsLink = "https://www.goodreads.com/book/show/8439958-mindfulness-for-beginners";
      tags = ["Mindfulness"];
      icon = "focus";
    }
  ]);

  let quotes = List.fromArray([
    "The science of enlightenment is not only about understanding the mind; it's about liberating it.",
    "Hardcore teachings of the Buddha remind us to embrace both the joys and challenges of meditation.",
    "Music has the power to soothe the mind and elevate the spirit in meditation.",
    "Journal entries are a reflection of our inner growth and evolving mindfulness.",
    "Progress is not measured by perfection, but by the persistence to continue the journey.",
    "Balance in meditation brings harmony to both the mind and body.",
    "Achievement in meditation is found in the stillness of the present moment.",
    "Growth is a natural outcome of consistent practice and self-reflection.",
    "Calmness is not the absence of turmoil, but the mastery of one's reaction to it.",
    "Mindfulness transforms everyday moments into opportunities for awareness and growth.",
    "Visualization techniques can unlock deep reservoirs of creativity and inspiration.",
    "IFS (Internal Family Systems) meditation helps integrate all parts of the self.",
    "Progress in meditation is like tending a garden; it flourishes with consistent care.",
    "Metta, or loving-kindness, extends peace to ourselves and the world.",
    "Audio guides can enhance meditation by providing structure and soothing rhythms.",
    "Consistent entries in your journal create a tapestry of self-discovery.",
    "Challenges are part of the journey; every meditation is a step forward.",
    "Reflections reveal the profound changes occurring within.",
    "Balance is achieved when we honor both the active and passive aspects of our practice.",
    "Achievement is the cumulative effect of small, consistent actions.",
    "Growth is both subtle and transformative, unfolding over time.",
    "Calmness is cultivated through intention and relaxed effort.",
    "The mind's natural state is calm and clear when unburdened by overthinking.",
    "Real progress is made one breath and one moment at a time.",
    "Challenge yourself to remain present through difficult moments.",
    "Reflection allows us to integrate our experiences and deepen our understanding.",
    "Balance is not found in perfection, but in harmonious living.",
    "Achievement in meditation is the renewed commitment to practice daily.",
    "Growth is measured by increased self-awareness and inner tranquility.",
    "Your journey is uniquely yours; celebrate each step along the path."
  ]);

  var journalEntries = Map.empty<Principal, List.List<JournalEntry>>();
  let sessionRecords = Map.empty<Principal, List.List<MeditationSession>>();
  let progressStats = Map.empty<Principal, ProgressStore>();
  let progressCache = Map.empty<Principal, ProgressStats>();
  let lastSessionTimestamps = Map.empty<Principal, Int>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextEntryId = 0;

  let accessControlState = AccessControl.initState();
  let defaultAvatar : ?Storage.ExternalBlob = null;

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  var ritualsStore = Map.empty<Principal, List.List<Ritual>>();

  // Utility function to ensure caller is initialized as a user
  func ensureUserInitialized(caller : Principal) {
    // Only non-anonymous callers can be initialized as users
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    // This will auto-provision the user if they haven't used the system before
    ignore AccessControl.hasPermission(accessControlState, caller, #user);
  };

  // Public endpoints accessible to all users (including guests)
  public query ({ caller }) func getBooks() : async [Book] {
    // No authorization required - public content
    books.toArray();
  };

  public query ({ caller }) func getDailyQuotes() : async [Text] {
    // No authorization required - public content
    quotes.toArray();
  };

  // User profile endpoints - require authenticated user
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };
    switch (userProfiles.get(caller)) {
      case (null) { ?{ name = ""; email = null; avatar = null } };
      case (?profile) { ?profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    // Users can only view their own profile, admins can view any profile
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    ensureUserInitialized(caller);
    userProfiles.add(caller, if (profile.name == "" and profile.avatar == null) { { name = "Anonymous"; email = null; avatar = null } } else { profile });
  };

  // Import/Export endpoints - require authenticated user
  public shared ({ caller }) func importData(importData : ImportData, overwrite : Bool) : async () {
    ensureUserInitialized(caller);

    // Security: Ensure all imported journal entries are assigned to the caller
    let sanitizedEntries = importData.journalEntries.map(func(entry : JournalEntry) : JournalEntry {
      { entry with user = caller };
    });

    if (overwrite) {
      nextEntryId += sanitizedEntries.size();
      journalEntries.add(caller, List.fromArray<JournalEntry>(sanitizedEntries));
      sessionRecords.add(caller, List.fromArray<MeditationSession>(importData.sessionRecords));

      let progressStore : ProgressStore = {
        currentStreak = importData.progressStats.currentStreak;
        totalMinutes = importData.progressStats.totalMinutes;
        sessions = List.fromArray<MeditationSession>(importData.sessionRecords);
      };
      progressStats.add(caller, progressStore);
      progressCache.add(caller, importData.progressStats);

      switch (importData.userProfile) {
        case (?profile) { userProfiles.add(caller, profile) };
        case (null) {};
      };
    } else {
      // Assign unique IDs to new entries to avoid collisions
      let newEntries = List.fromArray<JournalEntry>(
        sanitizedEntries.map(func(entry : JournalEntry) : JournalEntry {
          let newId = nextEntryId;
          nextEntryId += 1;
          { entry with id = newId; user = caller };
        })
      );

      switch (journalEntries.get(caller)) {
        case (?existing) {
          existing.addAll(newEntries.values());
          journalEntries.add(caller, existing);
        };
        case (null) {
          journalEntries.add(caller, newEntries);
        };
      };

      let newSessions = List.fromArray<MeditationSession>(importData.sessionRecords);
      switch (sessionRecords.get(caller)) {
        case (?existing) {
          existing.addAll(newSessions.values());
          sessionRecords.add(caller, existing);
        };
        case (null) {
          sessionRecords.add(caller, newSessions);
        };
      };

      let currentStats : ProgressStore = {
        currentStreak = importData.progressStats.currentStreak;
        totalMinutes = importData.progressStats.totalMinutes;
        sessions = List.fromArray<MeditationSession>(importData.sessionRecords);
      };
      progressStats.add(caller, currentStats);
      progressCache.add(caller, importData.progressStats);

      switch (importData.userProfile) {
        case (?profile) { userProfiles.add(caller, profile) };
        case (null) {};
      };
    };
  };

  type ExportData = {
    journalEntries : [JournalEntry];
    sessionRecords : [MeditationSession];
    progressStats : ProgressStats;
    userProfile : ?UserProfile;
  };

  // Fetch current user's journal entries (for export or persistent storage)
  public query ({ caller }) func getCallerJournalEntries() : async [JournalEntry] {
    ensureUserInitialized(caller);
    switch (journalEntries.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // Fetch current user's progress data (for persistent profile)
  public query ({ caller }) func getCallerProgressStats() : async ProgressStats {
    ensureUserInitialized(caller);
    switch (progressCache.get(caller)) {
      case (null) {
        {
          totalMinutes = 0;
          currentStreak = 0;
          monthlyMinutes = 0;
          rank = "Beginner";
        };
      };
      case (?cache) { cache };
    };
  };

  // Fetch current user's session records (for export or persistent storage)
  public query ({ caller }) func getCallerSessionRecords() : async [MeditationSession] {
    ensureUserInitialized(caller);
    switch (sessionRecords.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  public query ({ caller }) func getCurrentUserExportData() : async ExportData {
    ensureUserInitialized(caller);
    let entries = switch (journalEntries.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };

    let sessions = switch (sessionRecords.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };

    let progress = switch (progressCache.get(caller)) {
      case (null) {
        {
          totalMinutes = 0;
          currentStreak = 0;
          monthlyMinutes = 0;
          rank = "Beginner";
        };
      };
      case (?cache) { cache };
    };

    let profile = userProfiles.get(caller);

    {
      journalEntries = entries;
      sessionRecords = sessions;
      progressStats = progress;
      userProfile = profile;
    };
  };

  // Helper function to calculate rank based on total minutes
  private func calculateRank(totalMinutes : Nat) : Text {
    if (totalMinutes >= 1000) { "Master" }
    else if (totalMinutes >= 500) { "Expert" }
    else if (totalMinutes >= 200) { "Advanced" }
    else if (totalMinutes >= 50) { "Intermediate" }
    else { "Beginner" };
  };

  // Endpoint to persist client-calculated session progress
  public shared ({ caller }) func recordMeditationSession(session : MeditationSession, _monthlyStats : Nat, _currentStreak : Nat) : async ProgressStats {
    ensureUserInitialized(caller);
    let sessions : List.List<MeditationSession> = switch (sessionRecords.get(caller)) {
      case (null) {
        let newSessions = List.empty<MeditationSession>();
        newSessions.add(session);
        newSessions;
      };
      case (?existing) {
        existing.add(session);
        existing;
      };
    };
    sessionRecords.add(caller, sessions);

    // Calculate total minutes from all sessions
    var totalMinutes = 0;
    for (s in sessions.values()) {
      totalMinutes += s.minutes;
    };

    let rank = calculateRank(totalMinutes);

    let progressStore : ProgressStore = {
      currentStreak = _currentStreak;
      totalMinutes = totalMinutes;
      sessions;
    };
    progressStats.add(caller, progressStore);

    let newStats : ProgressStats = {
      totalMinutes = totalMinutes;
      currentStreak = _currentStreak;
      monthlyMinutes = _monthlyStats;
      rank = rank;
    };
    progressCache.add(caller, newStats);

    newStats;
  };

  // RITUALS FEATURE - require authenticated user
  public shared ({ caller }) func saveRitual(ritual : Ritual) : async () {
    ensureUserInitialized(caller);

    let newRitual = { ritual with timestamp = Time.now() };

    let existingRituals = switch (ritualsStore.get(caller)) {
      case (null) { List.empty<Ritual>() };
      case (?list) { list };
    };

    // Check for duplicates
    let isDuplicate = existingRituals.any(
      func(existing) {
        existing.meditationType == newRitual.meditationType and
        existing.duration == newRitual.duration and
        existing.ambientSound == newRitual.ambientSound and
        existing.ambientSoundVolume == newRitual.ambientSoundVolume
      }
    );

    if (isDuplicate) {
      Runtime.trap("DuplicateSoundscape: An identical soundscape already exists in your rituals collection. You cannot save this an additional time.");
    };

    if (existingRituals.size() >= 5) {
      Runtime.trap("RitualLimitExceeded: You can only save up to 5 ritual soundscapes. Please delete one before saving a new one.");
    };

    existingRituals.add(newRitual);
    ritualsStore.add(caller, existingRituals);
  };

  public query ({ caller }) func listCallerRituals() : async [Ritual] {
    ensureUserInitialized(caller);
    switch (ritualsStore.get(caller)) {
      case (null) { [] };
      case (?list) {
        let array = list.toArray();
        array.sort(
          func(a, b) {
            Int.compare(b.timestamp, a.timestamp);
          }
        );
      };
    };
  };

  public shared ({ caller }) func deleteRitual(ritualToDelete : Ritual) : async () {
    ensureUserInitialized(caller);
    switch (ritualsStore.get(caller)) {
      case (null) { Runtime.trap("RitualNotFound: No rituals found for this user") };
      case (?ritualsList) {
        let filteredRituals = ritualsList.filter(
          func(existing) {
            not (
              existing.meditationType == ritualToDelete.meditationType and
              existing.duration == ritualToDelete.duration and
              existing.ambientSound == ritualToDelete.ambientSound and
              existing.ambientSoundVolume == ritualToDelete.ambientSoundVolume
            );
          }
        );

        if (filteredRituals.size() == ritualsList.size()) {
          Runtime.trap("RitualNotFound: The specified ritual was not found and could not be deleted.");
        };

        ritualsStore.add(caller, filteredRituals);
      };
    };
  };
};
