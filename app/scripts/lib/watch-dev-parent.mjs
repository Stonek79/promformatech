// Detached dev processes lose this channel when their supervisor disappears.
if (process.connected) {
	process.once("disconnect", () => process.kill(process.pid, "SIGTERM"));
}
