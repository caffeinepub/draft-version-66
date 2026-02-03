import Nat "mo:core/Nat";
import Map "mo:core/Map";
import List "mo:core/List";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
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

  let books = List.fromArray<Book>([
    {
      title = "The Science of Enlightenment";
      author = "Shinzen Young";
      description = "A comprehensive guide to meditation practice, blending scientific insights with spiritual wisdom.";
      goodreadsLink = "https://www.goodreads.com/book/show/34219827-the-science-of-enlightenment";
      tags = ["Mindfulness", "Enlightenment", "Practice"];
      icon = "lotus";
    },
    {
      title = "Hardcore Teachings of the Buddha";
      author = "Daniel Ingram";
      description = "An in-depth exploration of advanced meditation practices from a practical, no-nonsense perspective.";
      goodreadsLink = "https://www.goodreads.com/book/show/34721144-mastering-the-core-teachings-of-the-buddha";
      tags = ["Buddhism", "Practice"];
      icon = "brain";
    },
    {
      title = "Mind Illuminated";
      author = "Culadasa (John Yates), Matthew Immergut, Jeremy Graves";
      description = "A detailed, step-by-step meditation manual combining Buddhist wisdom with neuroscience.";
      goodreadsLink = "https://www.goodreads.com/book/show/30255509-the-mind-illuminated";
      tags = ["Focus", "Mindfulness"];
      icon = "book";
    },
    {
      title = "The Power of Now";
      author = "Eckhart Tolle";
      description = "A spiritual guide focused on mindfulness, present moment awareness, and the transformative power of living mindfully.";
      goodreadsLink = "https://www.goodreads.com/book/show/6708.The_Power_of_Now";
      tags = ["Mindfulness", "Spirituality"];
      icon = "heart";
    },
    {
      title = "Ten Percent Happier";
      author = "Dan Harris";
      description = "A personal journey into mindfulness meditation, offering practical tips and insights for skeptics.";
      goodreadsLink = "https://www.goodreads.com/book/show/18505796-10-happier";
      tags = ["Personal Growth", "Mindfulness"];
      icon = "meditation";
    },
    {
      title = "Real Happiness";
      author = "Sharon Salzberg";
      description = "An accessible guide introducing meditation techniques and principles for sustainable happiness.";
      goodreadsLink = "https://www.goodreads.com/book/show/8911865-real-happiness";
      tags = ["Happiness", "Mindfulness"];
      icon = "book";
    },
    {
      title = "Waking Up";
      author = "Sam Harris";
      description = "An exploration of meditation, mindfulness, and non-duality from a neuroscience and philosophy perspective.";
      goodreadsLink = "https://www.goodreads.com/book/show/18774981-waking-up";
      tags = ["Neuroscience", "Non-duality"];
      icon = "meditation";
    },
    {
      title = "Wherever You Go, There You Are";
      author = "Jon Kabat-Zinn";
      description = "A classic introduction to mindfulness meditation and its practical application in daily life.";
      goodreadsLink = "https://www.goodreads.com/book/show/39080.Wherever_You_Go_There_You_Are";
      tags = ["Mindful Living", "Self-help"];
      icon = "lotus";
    },
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

  let journalEntries = Map.empty<Principal, List.List<JournalEntry>>();
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

  public query ({ caller }) func getBooks() : async ([Book]) {
    books.toArray();
  };

  public query ({ caller }) func getDailyQuotes() : async ([Text]) {
    quotes.toArray();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
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
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) { return };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };
    userProfiles.add(caller, if (profile.name == "" and profile.avatar == null) { { name = "Anonymous"; email = null; avatar = null } } else { profile });
  };

  public shared ({ caller }) func importData(importData : ImportData, overwrite : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };

    if (overwrite) {
      nextEntryId += importData.journalEntries.size();
      journalEntries.add(caller, List.fromArray<JournalEntry>(importData.journalEntries));
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
      let newEntries = List.fromArray<JournalEntry>(importData.journalEntries.map(func(entry) { { entry with id = nextEntryId } }));
      nextEntryId += importData.journalEntries.size();
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };

    switch (journalEntries.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // Fetch current user's progress data (for persistent profile)
  public query ({ caller }) func getCallerProgressStats() : async ProgressStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };

    switch (progressCache.get(caller)) {
      case (null) {
        {
          totalMinutes = 0;
          currentStreak = 0;
          monthlyMinutes = 0;
          rank = "";
        };
      };
      case (?cache) { cache };
    };
  };

  // Fetch current user's session records (for export or persistent storage)
  public query ({ caller }) func getCallerSessionRecords() : async [MeditationSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };

    switch (sessionRecords.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  public query ({ caller }) func getCurrentUserExportData() : async ExportData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };

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
          rank = "";
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

  // Endpoint to persist client-calculated session progress
  public shared ({ caller }) func recordMeditationSession(session : MeditationSession, _monthlyStats : Nat, _currentStreak : Nat) : async ProgressStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };

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

    let progressStore : ProgressStore = {
      currentStreak = _currentStreak;
      totalMinutes = _monthlyStats;
      sessions;
    };
    progressStats.add(caller, progressStore);

    let newStats : ProgressStats = {
      totalMinutes = _monthlyStats;
      currentStreak = _currentStreak;
      monthlyMinutes = _monthlyStats;
      rank = "";
    };
    progressCache.add(caller, newStats);

    newStats;
  };
};
