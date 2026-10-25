export const JOBS = {
	processMedia: "process-media",
	notifyLead: "notify-lead",
	mediaQueue: "media",
	emailQueue: "email",
} as const;

export const JOB_POLICY = {
	workerLockKey: 0x504654,
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
