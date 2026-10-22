import type { Access } from "payload";
import { CONTEXT, PUBLICATION, ROLES } from "@/config/content";

type StaffUser = {
	readonly id: number | string;
	readonly role: "owner" | "manager";
};

export function isStaff(user: unknown): user is StaffUser {
	return (
		typeof user === "object" &&
		user !== null &&
		"id" in user &&
		(typeof user.id === "number" || typeof user.id === "string") &&
		"role" in user &&
		(user.role === ROLES.owner || user.role === ROLES.manager)
	);
}

export function isOwner(user: unknown): user is StaffUser & { role: "owner" } {
	return isStaff(user) && user.role === ROLES.owner;
}

export const staffOnly: Access = ({ req }) => isStaff(req.user);
export const ownerOnly: Access = ({ req }) => isOwner(req.user);
export const publishedOrStaff: Access = ({ req }) =>
	isStaff(req.user) || { _status: { equals: PUBLICATION.published } };
export const mediaReader: Access = ({ req }) =>
	isStaff(req.user) ||
	(req.context[CONTEXT.publicContent] === true
		? { _status: { equals: PUBLICATION.published } }
		: false);
export const deny: Access = () => false;
