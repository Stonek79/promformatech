import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from "@payloadcms/next/rsc";
import {
	AlignFeatureClient as AlignFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	BlockquoteFeatureClient as BlockquoteFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	ChecklistFeatureClient as ChecklistFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	FixedToolbarFeatureClient as FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	HeadingFeatureClient as HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	HorizontalRuleFeatureClient as HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	IndentFeatureClient as IndentFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	InlineCodeFeatureClient as InlineCodeFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	InlineToolbarFeatureClient as InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	ItalicFeatureClient as ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	ParagraphFeatureClient as ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	StrikethroughFeatureClient as StrikethroughFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	SubscriptFeatureClient as SubscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	SuperscriptFeatureClient as SuperscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	UnderlineFeatureClient as UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
} from "@payloadcms/richtext-lexical/client";
import {
	LexicalDiffComponent as LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
	RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
	RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
} from "@payloadcms/richtext-lexical/rsc";
import { AdminMessagesProvider as AdminMessagesProvider_a25cbb333b2e032f6494ab2414dfe885 } from "../../../cms/components/AdminMessagesProvider";
import { AppearanceAction as AppearanceAction_111cad57c5b11e2125d64d2f12b22107 } from "../../../cms/components/AppearanceAction";
import { CMSLogo as CMSLogo_2d492d46e128fcfd71b1be1b2d6c23a5 } from "../../../cms/components/CMSLogo";
import { Dashboard as Dashboard_758cc56c4b18c5339e55ed707c830b18 } from "../../../cms/components/Dashboard";
import { EnvironmentStatus as EnvironmentStatus_b9c770ac69a9350941f295f5dc6f54ac } from "../../../cms/components/EnvironmentStatus";
import { MediaProcessingStatus as MediaProcessingStatus_791a566ef10ca8c4f2308aecdbb7ae4a } from "../../../cms/components/MediaProcessingStatus";
import { MediaTitleField as MediaTitleField_8ab9aeee1b8cd260ff54a05f0f14ca84 } from "../../../cms/components/MediaTitleField";
import { OriginalDownload as OriginalDownload_47b108db1c397167e3764aa97054ccf9 } from "../../../cms/components/OriginalDownload";
import { RetryMedia as RetryMedia_aad19fbd69c5492af55b57000d52fde6 } from "../../../cms/components/RetryMedia";
import { ContextHelp as ContextHelp_4a9db51652719fcaf8704e9eec9a1454 } from "../../../cms/help/ContextHelp";
import { HelpNavLink as HelpNavLink_b2cf63aae7186b3fb5480d6dc646e49d } from "../../../cms/help/HelpNavLink";
import { HelpView as HelpView_5acc8485435a3b38ab16ee5c5241f733 } from "../../../cms/help/HelpView";

/** @type import('payload').ImportMap */
export const importMap = {
	"/cms/help/ContextHelp#ContextHelp":
		ContextHelp_4a9db51652719fcaf8704e9eec9a1454,
	"@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell":
		RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
	"@payloadcms/richtext-lexical/rsc#RscEntryLexicalField":
		RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
	"@payloadcms/richtext-lexical/rsc#LexicalDiffComponent":
		LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
	"@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient":
		FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient":
		InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient":
		HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#BlockquoteFeatureClient":
		BlockquoteFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#LinkFeatureClient":
		LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#ChecklistFeatureClient":
		ChecklistFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#OrderedListFeatureClient":
		OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#UnorderedListFeatureClient":
		UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#IndentFeatureClient":
		IndentFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#AlignFeatureClient":
		AlignFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#HeadingFeatureClient":
		HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#ParagraphFeatureClient":
		ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#InlineCodeFeatureClient":
		InlineCodeFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#SuperscriptFeatureClient":
		SuperscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#SubscriptFeatureClient":
		SubscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#StrikethroughFeatureClient":
		StrikethroughFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#UnderlineFeatureClient":
		UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#BoldFeatureClient":
		BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"@payloadcms/richtext-lexical/client#ItalicFeatureClient":
		ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
	"/cms/components/MediaTitleField#MediaTitleField":
		MediaTitleField_8ab9aeee1b8cd260ff54a05f0f14ca84,
	"/cms/components/OriginalDownload#OriginalDownload":
		OriginalDownload_47b108db1c397167e3764aa97054ccf9,
	"/cms/components/MediaProcessingStatus#MediaProcessingStatus":
		MediaProcessingStatus_791a566ef10ca8c4f2308aecdbb7ae4a,
	"/cms/components/RetryMedia#RetryMedia":
		RetryMedia_aad19fbd69c5492af55b57000d52fde6,
	"/cms/components/EnvironmentStatus#EnvironmentStatus":
		EnvironmentStatus_b9c770ac69a9350941f295f5dc6f54ac,
	"/cms/components/CMSLogo#CMSLogo": CMSLogo_2d492d46e128fcfd71b1be1b2d6c23a5,
	"/cms/components/AppearanceAction#AppearanceAction":
		AppearanceAction_111cad57c5b11e2125d64d2f12b22107,
	"/cms/components/Dashboard#Dashboard":
		Dashboard_758cc56c4b18c5339e55ed707c830b18,
	"/cms/help/HelpNavLink#HelpNavLink":
		HelpNavLink_b2cf63aae7186b3fb5480d6dc646e49d,
	"/cms/components/AdminMessagesProvider#AdminMessagesProvider":
		AdminMessagesProvider_a25cbb333b2e032f6494ab2414dfe885,
	"/cms/help/HelpView#HelpView": HelpView_5acc8485435a3b38ab16ee5c5241f733,
	"@payloadcms/next/rsc#CollectionCards":
		CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1,
};
