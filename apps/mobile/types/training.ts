export type MuscleGroup = "chest" | "back" | "shoulders" | "arms" | "legs" | "core" | "waist" | "cardio" | "upper arms" | "lower arms" | "upper legs" | "lower legs" | "neck";

export type LibraryExercise = {
  id: string;
  name: string;
  displayName: string;
  searchTerms: string[];
  source: "workoutx" | "research-gif-dataset" | "local";
  sourceId: string;
  license: string;
  mediaType: "gif" | "image" | "none";
  level: string | null;
  riskLevel?: "low" | "medium" | "high";
  riskLabel?: string;
  equipment: string | null;
  category: string | null;
  bodyPart: string | null;
  gifUrl: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
};

export type WorkoutXExercise = {
  id?: string;
  exerciseId?: string;
  name?: string;
  level?: string | null;
  difficulty?: string | null;
  equipment?: string | null;
  category?: string | null;
  bodyPart?: string | null;
  target?: string | null;
  gifUrl?: string | null;
  videoUrl?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[] | string;
};

export type WorkoutXListResponse = {
  total?: number;
  count?: number;
  data?: WorkoutXExercise[];
  results?: WorkoutXExercise[];
};

export type SupplementalExercise = {
  id?: string;
  name?: string;
  category?: string;
  body_part?: string;
  equipment?: string;
  target?: string;
  muscle_group?: string;
  secondary_muscles?: string[];
  image?: string;
  gif_url?: string;
  instruction_steps?: {
    en?: string[];
  };
  instructions?: {
    en?: string;
  };
};

export type SupplementalExerciseManifest = {
  items?: SupplementalExercise[];
};
