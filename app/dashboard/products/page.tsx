// app/dashboard/products/page.tsx — Merchant product management (DB-backed CRUD via /api/products)

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MinusIcon, PlusIcon, SearchIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPaise } from "@/lib/data/products";

type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  pricePaise: number;
  costPaise: number;
  marginPct: number;
  stock: number;
  image: string | null;
};

const CATEGORIES = ["Brewers", "Grinders", "Kettles", "Accessories", "Beans"] as const;

type ProductForm = {
  name: string;
  category: string;
  description: string;
  price: string;
  cost: string;
  stock: string;
};

const EMPTY_FORM: ProductForm = { name: "", category: "Brewers", description: "", price: "", cost: "", stock: "0" };

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; item: CatalogItem }
  | { mode: "delete"; item: CatalogItem }
  | null;

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (stock <= 5) return <Badge variant="outline">Low stock</Badge>;
  return <Badge>In stock</Badge>;
}

export default function MerchantProductsPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [stockBusyId, setStockBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [canManage, setCanManage] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as { items?: CatalogItem[]; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not load products");
      setItems(body?.items ?? []);
      setLoadError(false);
    } catch (err) {
      setLoadError(true);
      toast.error(err instanceof Error ? err.message : "Could not load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  // Who is signed in — owners/admins can save changes; everyone else browses read-only.
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCanManage(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setCanManage(profile?.role === "owner" || profile?.role === "admin");
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        (q === "" || item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)),
    );
  }, [items, query, category]);

  const outOfStock = items.filter((i) => i.stock === 0).length;

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialog({ mode: "create" });
  }

  function openEdit(item: CatalogItem) {
    setForm({
      name: item.name,
      category: (CATEGORIES as readonly string[]).includes(item.category) ? item.category : "Brewers",
      description: item.description ?? "",
      price: (item.pricePaise / 100).toFixed(2),
      cost: (item.costPaise / 100).toFixed(2),
      stock: String(item.stock),
    });
    setDialog({ mode: "edit", item });
  }

  async function handleSubmit() {
    const editing = dialog?.mode === "edit" ? dialog.item : null;

    const name = form.name.trim();
    const pricePaise = Math.round(Number(form.price) * 100);
    const costPaise = form.cost.trim() === "" ? 0 : Math.round(Number(form.cost) * 100);
    const stock = Math.max(0, Math.round(Number(form.stock) || 0));

    if (name.length < 2) {
      toast.error("Product name must be at least 2 characters.");
      return;
    }
    if (!Number.isFinite(pricePaise) || pricePaise <= 0) {
      toast.error("Enter a price greater than ₹0.");
      return;
    }
    if (!Number.isFinite(costPaise) || costPaise < 0 || costPaise >= pricePaise) {
      toast.error("Cost must be ₹0 or more and below the price.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: form.category,
          description: form.description.trim(),
          pricePaise,
          costPaise,
          stock,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        toast.error(
          res.status === 403
            ? "Sign in as an owner or admin to manage products."
            : body?.message ?? "Could not save the product.",
        );
        return;
      }
      toast.success(editing ? `Updated ${name}` : `Added ${name}`);
      setDialog(null);
      await load();
    } catch {
      toast.error("Network error — the product was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CatalogItem) {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${item.id}`, { method: "DELETE" });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        toast.error(
          res.status === 403
            ? "Sign in as an owner or admin to delete products."
            : body?.message ?? "Could not delete the product.",
        );
        return;
      }
      toast.success(`Deleted ${item.name}`);
      setDialog(null);
      await load();
    } catch {
      toast.error("Network error — the product was not deleted.");
    } finally {
      setSaving(false);
    }
  }

  async function adjustStock(item: CatalogItem, delta: number) {
    const next = Math.max(0, item.stock + delta);
    if (next === item.stock) return;
    setStockBusyId(item.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stock: next } : i)));
    try {
      const res = await fetch(`/api/products/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: next }),
      });
      if (!res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stock: item.stock } : i)));
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        toast.error(
          res.status === 403
            ? "Sign in as an owner or admin to change stock."
            : body?.message ?? "Stock update failed.",
        );
      }
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stock: item.stock } : i)));
      toast.error("Network error — stock was not saved.");
    } finally {
      setStockBusyId(null);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Product Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Loading catalog…" : `${items.length} products${outOfStock > 0 ? ` · ${outOfStock} out of stock` : ""}`}
            </p>
          </div>
          <Button className="h-11 sm:h-8" onClick={openCreate}>
            Add product
          </Button>
        </div>

        {canManage === false && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              You’re viewing the catalog read-only. Sign in with an owner or admin account to save changes.
            </p>
            <Link href="/login">
              <Button variant="outline" size="sm" className="h-11 sm:h-8">
                Sign in
              </Button>
            </Link>
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-xs sm:flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 pl-8 sm:h-8"
              placeholder="Search products…"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={(value) => setCategory(String(value))}>
            <SelectTrigger className="h-11 w-full sm:h-8 sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All", ...CATEGORIES].map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "All" ? "All categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0 max-sm:p-4">
            <Table className="table-cards">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Loading products…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      {loadError
                        ? "Couldn’t load the catalog — try refreshing the page."
                        : items.length === 0
                          ? "No products yet — add your first product."
                          : "No products match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell data-label="Product">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element -- catalog images are arbitrary product URLs
                            <img src={item.image} alt="" className="size-9 rounded-md object-cover ring-1 ring-foreground/10" />
                          ) : (
                            <div className="size-9 rounded-md bg-muted" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium">{item.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{item.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-label="Category">{item.category}</TableCell>
                      <TableCell data-label="Price">{formatPaise(item.pricePaise)}</TableCell>
                      <TableCell data-label="Stock">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="size-11 sm:size-7"
                            aria-label={`Decrease stock for ${item.name}`}
                            disabled={canManage === false || stockBusyId === item.id || item.stock === 0}
                            onClick={() => void adjustStock(item, -1)}
                          >
                            <MinusIcon className="size-3.5" />
                          </Button>
                          <span className="w-8 text-center tabular-nums">{item.stock}</span>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="size-11 sm:size-7"
                            aria-label={`Increase stock for ${item.name}`}
                            disabled={canManage === false || stockBusyId === item.id}
                            onClick={() => void adjustStock(item, 1)}
                          >
                            <PlusIcon className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell data-label="Margin">{Number(item.marginPct) || 0}%</TableCell>
                      <TableCell data-label="Status">
                        <StockBadge stock={item.stock} />
                      </TableCell>
                      <TableCell data-label="Actions" className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-11 sm:h-7" onClick={() => openEdit(item)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-11 sm:h-7"
                            onClick={() => setDialog({ mode: "delete", item })}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {dialog?.mode === "delete" ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete product?</DialogTitle>
                <DialogDescription>
                  “{dialog.item.name}” will be removed from the catalog. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" className="h-11 sm:h-9" />}>Cancel</DialogClose>
                <Button
                  variant="destructive"
                  className="h-11 sm:h-9"
                  disabled={saving}
                  onClick={() => void handleDelete(dialog.item)}
                >
                  {saving ? "Deleting…" : "Delete product"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{dialog?.mode === "edit" ? "Edit product" : "Add new product"}</DialogTitle>
                <DialogDescription>
                  {dialog?.mode === "edit"
                    ? `Update “${dialog.item.name}” — changes go live in the storefront immediately.`
                    : "It goes live in the storefront as soon as you save."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Name</Label>
                  <Input
                    id="product-name"
                    className="h-11 sm:h-9"
                    placeholder="Ethiopia Yirgacheffe 250g"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(value) => setForm((f) => ({ ...f, category: String(value) }))}>
                    <SelectTrigger className="h-11 w-full sm:h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-description">Description</Label>
                  <Input
                    id="product-description"
                    className="h-11 sm:h-9"
                    placeholder="Optional"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-price">Price (₹)</Label>
                    <Input
                      id="product-price"
                      className="h-11 sm:h-9"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-cost">Cost (₹)</Label>
                    <Input
                      id="product-cost"
                      className="h-11 sm:h-9"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.cost}
                      onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-stock">Stock</Label>
                  <Input
                    id="product-stock"
                    className="h-11 sm:h-9"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" className="h-11 sm:h-9" />}>Cancel</DialogClose>
                <Button className="h-11 sm:h-9" disabled={saving} onClick={() => void handleSubmit()}>
                  {saving ? "Saving…" : dialog?.mode === "edit" ? "Save changes" : "Add product"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
