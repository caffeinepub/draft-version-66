import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";

module {
  type Book = {
    title : Text;
    author : Text;
    description : Text;
    goodreadsLink : Text;
    tags : [Text];
    icon : Text;
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

  type MeditationType = {
    #mindfulness;
    #metta;
    #visualization;
    #ifs;
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

  type JournalEntryInput = {
    meditationType : MeditationType;
    duration : Nat;
    mood : [MoodState];
    energy : EnergyState;
    reflection : Text;
    timestamp : Int;
    isFavorite : Bool;
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

  type Ritual = {
    meditationType : MeditationType;
    duration : Nat;
    ambientSound : Text;
    ambientSoundVolume : Nat;
    timestamp : Int;
  };

  type Actor = {
    progressCache : Map.Map<Principal, ProgressStats>;
    journalEntries : Map.Map<Principal, List.List<JournalEntry>>;
    sessionRecords : Map.Map<Principal, List.List<MeditationSession>>;
    ritualsStore : Map.Map<Principal, List.List<Ritual>>;
    progressStats : Map.Map<Principal, ProgressStore>;
    nextEntryId : Nat;
    lastSessionTimestamps : Map.Map<Principal, Int>;
    books : List.List<Book>;
    quotes : List.List<Text>;
  };

  public func run(state : Actor) : Actor {
    state;
  };
};
