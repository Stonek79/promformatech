"use client";

import { TextField, useField, useFormFields } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";
import { useEffect, useRef } from "react";
import { MEDIA_TITLE } from "@/config/media";
import { mediaTitleFromFilename } from "@/features/media/title";

export function MediaTitleField(props: TextFieldClientProps) {
	const { value, setValue } = useField<string>({ path: props.path });
	const file = useFormFields(
		([fields]) => fields[MEDIA_TITLE.fileField]?.value,
	);
	const lastFile = useRef<File | null>(null);
	const generatedTitle = useRef<string | null>(null);
	useEffect(() => {
		if (!(file instanceof File) || file === lastFile.current) {
			return;
		}
		lastFile.current = file;
		if (
			typeof value === "string" &&
			value.trim() &&
			value !== generatedTitle.current
		) {
			return;
		}
		const title = mediaTitleFromFilename(file.name);
		generatedTitle.current = title;
		setValue(title);
	}, [file, value, setValue]);
	return <TextField {...props} />;
}
