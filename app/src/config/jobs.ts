export const JOBS = {
	processMedia: "process-media",
	mediaQueue: "media",
} as const;

export const JOB_POLICY = {
	lockStaleMilliseconds: 60_000,
	lockUpdateMilliseconds: 10_000,
	retryAttempts: 2,
	retryDelayMilliseconds: 3000,
	shutdownGraceMilliseconds: 30_000,
	heartbeatMilliseconds: 10_000,
	heartbeatFile: "worker-heartbeat.json",
	onceArgument: "once",
	receiptFile: "processing.json",
	receiptVersion: 1,
	maximumProcessOutputBytes: 1_048_576,
	errorOutputTailLength: 1000,
} as const;
export const PROCESS_FAILURE = {
	interrupted: "interrupted",
	timeout: "timeout",
	output: "output",
	failed: "failed",
	spawn: "spawn",
} as const;
