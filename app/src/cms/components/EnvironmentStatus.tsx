import { smtpConfigured } from "../email";
import styles from "./admin.module.css";

export function EnvironmentStatus() {
	return (
		<div className={styles.dashboard}>
			<h3>Подключения</h3>
			<p>
				Исходящая почта:{" "}
				{smtpConfigured()
					? "адаптер настроен; доставка проверяется отдельно"
					: "SMTP ещё не настроен"}
				.
			</p>
			<p>
				Внешняя резервная копия: подключается администратором сервера. Наличие
				локального тома не подтверждает наличие резервной копии.
			</p>
			<p>
				Пароли и ключи хранятся в окружении сервера и не редактируются через
				CMS.
			</p>
		</div>
	);
}
