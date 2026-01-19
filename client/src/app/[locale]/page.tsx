import { useTranslations } from "next-intl";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "metadata.home" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default function Home() {
	const t = useTranslations("map");
	return (
		<header>
			<h1>{t("title")}</h1>
			<p>
				Explore and combine geographical data overlays. Analyze your area of
				interest and get custom insights
			</p>
		</header>
	);
}
