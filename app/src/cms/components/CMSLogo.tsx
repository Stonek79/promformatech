import Image from "next/image";
import brandMark from "@/app/icon.png";
import styles from "./admin.module.css";

export function CMSIcon() {
	return (
		<Image
			src={brandMark}
			alt=""
			className={styles.mark}
			width={24}
			height={24}
			unoptimized
		/>
	);
}

export function CMSLogo() {
	return (
		<span className={styles.logo}>
			<span>ПРОМ</span>ФОРМАТЕХ
		</span>
	);
}
