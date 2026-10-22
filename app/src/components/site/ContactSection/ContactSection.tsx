import { Heading, Section } from "@/components/ui/Layout/Layout";
import { InquiryForm } from "@/features/leads/InquiryForm";
import type { SiteSetting } from "@/payload-types";
import styles from "./ContactSection.module.css";

export function ContactSection({
	copy,
	preview,
}: {
	readonly copy: SiteSetting["form"];
	readonly preview: boolean;
}) {
	return (
		<Section id="contact" className={styles.section}>
			<div>
				{copy?.title && <Heading>{copy.title}</Heading>}
				{copy?.description && <p>{copy.description}</p>}
			</div>
			<InquiryForm copy={copy} preview={preview} />
		</Section>
	);
}
