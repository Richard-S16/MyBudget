import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureDefaultCategories } from "@/lib/actions/categories";
import { quickCreateEntry } from "@/lib/actions/quick";
import { QuickEntryForm } from "@/components/quick/quick-entry-form";

export const metadata = {
  title: "Quick Entry — MyBudget",
};

export default async function QuickEntryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const categories = await ensureDefaultCategories(session.user.id);

  async function action(formData: FormData) {
    "use server";
    return quickCreateEntry(formData);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background md:static md:min-h-screen">
      <QuickEntryForm categories={categories} onAction={action} />
    </div>
  );
}
