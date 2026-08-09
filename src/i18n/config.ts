import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // قراءة اللغة من الكوكي
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ar";

  return {
    locale,
    messages: (await import(`./locales/${locale}/common.json`)).default,
  };
});