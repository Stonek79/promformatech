import { Heading } from "@/components/ui/Layout/Layout";
import { isSafeHref, phoneHref } from "@/lib/urls";
import type { SiteSetting } from "@/payload-types";
import styles from "./pages.module.css";

export function Contacts({ settings }: { readonly settings: SiteSetting }) {
	return (
		<div className={styles.locations}>
			{settings.locations?.map((location) => (
				<section key={location.id} className={styles.location}>
					<Heading as="h2">{location.title}</Heading>
					<address>
						<p>{location.address}</p>
						{location.people?.map((person) => (
							<div key={person.id} className={styles.person}>
								<h3>
									{person.name}
									{person.position && <span> — {person.position}</span>}
								</h3>
								{person.phone && (
									<a href={phoneHref(person.phone)}>{person.phone}</a>
								)}
								{person.email && (
									<a href={`mailto:${person.email}`}>{person.email}</a>
								)}
								{isSafeHref(person.messengerURL) && (
									<a
										href={person.messengerURL}
										target="_blank"
										rel="noreferrer"
									>
										WhatsApp / WeChat ↗
									</a>
								)}
							</div>
						))}
					</address>
				</section>
			))}
		</div>
	);
}
