import type { CustomComponent } from "payload";
import type { HelpTopic } from "@/config/help";

export function helpDescription(topic: HelpTopic): CustomComponent {
	return {
		path: "/cms/help/ContextHelp#ContextHelp",
		serverProps: { topic },
	};
}
