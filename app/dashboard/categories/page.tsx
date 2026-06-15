import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createCategory,
  deleteCategory,
  ensureDefaultCategories,
  updateCategory,
} from "@/lib/actions/categories";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

export default async function CategoriesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const categoriesList = await ensureDefaultCategories(userId);

  async function createAction(formData: FormData) {
    "use server";
    try {
      await createCategory(userId, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async function updateAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return { success: false, error: "Missing id" };
    try {
      await updateCategory(userId, id, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async function deleteAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Missing id");
    await deleteCategory(userId, id);
  }

  const typeLabels: Record<string, string> = {
    fixed_expenses: "Fixed expenses",
    investments: "Investments",
    donations: "Donations",
    free_spending: "Free spending",
  };

  const grouped = categoriesList.reduce<Record<string, typeof categoriesList>>(
    (acc, cat) => {
      acc[cat.type] = acc[cat.type] ? [...acc[cat.type], cat] : [cat];
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Categories
          </h1>
          <p className="text-muted-foreground">
            The four money buckets and your custom categories.
          </p>
        </div>
        <CategoryDialog onAction={createAction} />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(grouped).map(([type, cats]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge variant="secondary">{typeLabels[type] ?? type}</Badge>
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {cats.length} categor{cats.length === 1 ? "y" : "ies"}
                </span>
              </CardTitle>
              <CardDescription>
                {type === "fixed_expenses" && "Bills and obligations"}
                {type === "investments" && "Money working for you"}
                {type === "donations" && "Giving and contributions"}
                {type === "free_spending" && "Discretionary spending"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cats.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <CategoryDialog
                            category={cat}
                            onAction={updateAction}
                            trigger={
                              <button className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                                <span className="sr-only">Edit</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                              </button>
                            }
                          />
                          <DeleteButton
                            id={cat.id}
                            action={deleteAction}
                            label={cat.name}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Tag className="mb-3 h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium">Categories match your buckets</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Every expense maps to one of the four types: Fixed expenses,
            Investments, Donations or Free spending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
