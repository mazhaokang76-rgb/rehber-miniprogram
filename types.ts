export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseResult {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
}

export enum ExerciseType {
  SHOULDER_ABDUCTION = 'SHOULDER_ABDUCTION',
  ELBOW_FLEXION = 'ELBOW_FLEXION',
  SQUAT = 'SQUAT'
}

export interface ExerciseConfig {
  id: ExerciseType;
  name: string;
  description: string;
  targetJoints: number[]; // Indices of joints to track
  thresholdAngle: number; // Degrees of allowed error
  durationSec: number;
  standardVideoUrl?: string; // URL to a reference video (mock)
}

export interface WorkoutSession {
  id: string;
  exerciseId: ExerciseType;
  timestamp: number;
  duration: number;
  accuracyScore: number; // 0-100
  correctionCount: number;
  feedbackLog: string[];
}

// Map of MediaPipe Pose Landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};