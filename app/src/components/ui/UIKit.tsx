"use client";

import { Badge } from "./Badge/Badge";
import { Button } from "./Button/Button";
import { Dialog } from "./Dialog/Dialog";
import { Field, Input, Textarea } from "./Field/Field";
import { Heading, Section, Stack } from "./Layout/Layout";

export function UIKit() {
	return (
		<Section>
			<Heading as="h1">Компоненты интерфейса</Heading>
			<Stack>
				<Heading>Кнопки и статусы</Heading>
				<Button>Основное действие</Button>
				<Button variant="ghost">Вторичное действие</Button>
				<Button disabled>Недоступно</Button>
				<Badge>Черновик</Badge>
				<Badge tone="success">Опубликовано</Badge>
				<Badge tone="danger">Ошибка</Badge>
				<Heading>Поля</Heading>
				<Field id="kit-name" label="Название">
					<Input id="kit-name" placeholder="Обычное поле" />
				</Field>
				<Field id="kit-error" label="Поле с ошибкой" error="Укажите значение">
					<Input
						id="kit-error"
						aria-invalid
						aria-describedby="kit-error-error"
					/>
				</Field>
				<Field id="kit-disabled" label="Недоступное поле">
					<Input id="kit-disabled" disabled value="Недоступно" />
				</Field>
				<Field id="kit-text" label="Текст">
					<Textarea id="kit-text" />
				</Field>
				<Dialog
					title="Проверка диалога"
					trigger={<Button>Открыть диалог</Button>}
				>
					<p>Проверьте Tab, Escape, фокус и прокрутку.</p>
					<Input aria-label="Поле внутри диалога" />
				</Dialog>
			</Stack>
		</Section>
	);
}
