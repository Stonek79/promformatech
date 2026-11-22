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
					<div className={styles.personIdentity}>
						<h3>{person.name}</h3>
						{person.position && (
							<p lang={person.positionLanguage}>{person.position}</p>
						)}
					</div>
					{person.phone && (
						<a className={styles.phone} href={phoneHref(person.phone)}>
							{person.phone}
						</a>
					)}
					{person.email && (
						<a className={styles.email} href={`mailto:${person.email}`}>
							{person.email}
						</a>
					)}
					{isSafeHref(person.messengerURL) && (
						<a
							className={styles.messenger}
							href={person.messengerURL}
							target="_blank"
							rel="noreferrer"
						>
							WhatsApp / WeChat ↗
						</a>
					)}
				</div>
			))}
		</div>
	);
}
