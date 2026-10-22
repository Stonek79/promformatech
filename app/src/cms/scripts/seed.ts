import { getCMS } from "@/cms/client";
import { seedSite } from "../seed/run";

const cms = await getCMS();
try {
	await seedSite(cms);
} finally {
	await cms.destroy();
}
