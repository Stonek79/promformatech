import type { ContactLocation } from "@/features/content/site-settings";
import { isSafeHref, phoneHref } from "@/lib/urls";
import styles from "./Contacts.module.css";

export function ContactPeople({
	people,
}: {
	readonly people: ContactLocation["people"];
}) {
	if (!people?.length) {
		return null;
	}
	return (
		<div className={styles.people}>
			{people.map((person) => (
				<div key={person.id} className={styles.person}>
					<h3>
						{person.name}
						{person.position && (
							<span lang={person.positionLanguage}> — {person.position}</span>
						)}
					</h3>
					{person.phone && (
						<a
							className={styles.contactLine}
							href={phoneHref(person.phone)}
							title={person.phone}
						>
							{person.phone}
						</a>
					)}
					{person.email && (
						<a
							className={styles.contactLine}
							href={`mailto:${person.email}`}
							title={person.email}
						>
							{person.email}
						</a>
					)}
					{isSafeHref(person.messengerURL) && (
						<a href={person.messengerURL} target="_blank" rel="noreferrer">
							WhatsApp / WeChat ↗
						</a>
					)}
				</div>
			))}
		</div>
	);
}
