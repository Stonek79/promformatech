import Link from "next/link";
import { ADMIN_HELP, adminHelpURL } from "@/config/help";
import styles from "./help.module.css";

export function HelpNavLink() {
	return (
		<Link className={styles.navLink} href={adminHelpURL()}>
			{ADMIN_HELP.title}
		</Link>
	);
}
