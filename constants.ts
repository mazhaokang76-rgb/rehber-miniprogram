import { ExerciseConfig, ExerciseType, POSE_LANDMARKS } from './types';

export const EXERCISES: Record<ExerciseType, ExerciseConfig> = {
  [ExerciseType.SHOULDER_ABDUCTION]: {
    id: ExerciseType.SHOULDER_ABDUCTION,
    name: "双臂外展 (Shoulder Abduction)",
    description: "保持躯干直立，双臂侧平举至90度。主要用于肩袖损伤康复。",
    targetJoints: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
    thresholdAngle: 15, // Allows 15 degree error
    durationSec: 60,
    standardVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" 
  },
  [ExerciseType.ELBOW_FLEXION]: {
    id: ExerciseType.ELBOW_FLEXION,
    name: "肘关节屈伸 (Elbow Flexion)",
    description: "大臂贴紧身体，缓慢弯曲手肘触摸肩部。用于肘部术后恢复。",
    targetJoints: [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW],
    thresholdAngle: 10,
    durationSec: 45,
    standardVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  },
  [ExerciseType.SQUAT]: {
    id: ExerciseType.SQUAT,
    name: "康复深蹲 (Rehab Squat)",
    description: "背部挺直，下蹲至大腿与地面平行。注意膝盖不要超过脚尖。",
    targetJoints: [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.LEFT_HIP],
    thresholdAngle: 20,
    durationSec: 60,
    standardVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  }
};

// Corrected URL for the MediaPipe Pose Landmarker Lite model
export const MEDIAPIPE_MODEL_ASSET_PATH = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
// Using 0.10.14 stable version for better compatibility
export const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

// Manually define connections to ensure they are always available regardless of library version exports
export const SKELETON_CONNECTIONS = [
  { start: 0, end: 1 }, { start: 1, end: 2 }, { start: 2, end: 3 }, { start: 3, end: 7 }, { start: 0, end: 4 }, 
  { start: 4, end: 5 }, { start: 5, end: 6 }, { start: 6, end: 8 }, { start: 9, end: 10 }, { start: 11, end: 12 }, 
  { start: 11, end: 13 }, { start: 13, end: 15 }, { start: 15, end: 17 }, { start: 15, end: 19 }, { start: 15, end: 21 }, 
  { start: 17, end: 19 }, { start: 12, end: 14 }, { start: 14, end: 16 }, { start: 16, end: 18 }, { start: 16, end: 20 }, 
  { start: 16, end: 22 }, { start: 18, end: 20 }, { start: 11, end: 23 }, { start: 12, end: 24 }, { start: 23, end: 24 }, 
  { start: 23, end: 25 }, { start: 24, end: 26 }, { start: 25, end: 27 }, { start: 26, end: 28 }, { start: 27, end: 29 }, 
  { start: 28, end: 30 }, { start: 29, end: 31 }, { start: 30, end: 32 }, { start: 27, end: 31 }, { start: 28, end: 32 }
];