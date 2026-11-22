import { MIGRATION_POLICY } from "@/config/migrations";
import {
	down as downInitial,
	up as upInitial,
} from "./20261030_161831_initial";
import {
	down as downContactMaps,
	up as upContactMaps,
} from "./20261118_125548_contact_maps";
import {
	down as downLocalizedContacts,
	up as upLocalizedContacts,
} from "./20261118_135524_localized_contacts";
import {
	down as downLocalizedSiteSettings,
	up as upLocalizedSiteSettings,
} from "./20261118_190149_localized_site_settings";
import {
	down as downLocalizedPages,
	up as upLocalizedPages,
} from "./20261118_192914_localized_pages";
import {
	down as downLocalizedMaterials,
	up as upLocalizedMaterials,
} from "./20261118_195013_localized_materials";

export const migrations = [
	{ up: upInitial, down: downInitial, name: MIGRATION_POLICY.required[0] },
	{
		up: upContactMaps,
		down: downContactMaps,
		name: MIGRATION_POLICY.required[1],
	},
	{
		up: upLocalizedContacts,
		down: downLocalizedContacts,
		name: MIGRATION_POLICY.required[2],
	},
	{
		up: upLocalizedSiteSettings,
		down: downLocalizedSiteSettings,
		name: MIGRATION_POLICY.required[3],
	},
	{
		up: upLocalizedPages,
		down: downLocalizedPages,
		name: MIGRATION_POLICY.required[4],
	},
	{
		up: upLocalizedMaterials,
		down: downLocalizedMaterials,
		name: MIGRATION_POLICY.required[5],
	},
];
