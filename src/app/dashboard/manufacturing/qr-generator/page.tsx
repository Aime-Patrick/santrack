"use client";

import { useState } from "react";
import { QrCode, Download, Package, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/products";
import { useItems } from "@/hooks/items";
import { api } from "@/lib/api";

export default function QRGeneratorPage() {
  const [selectedProductSku, setSelectedProductSku] = useState("");
  const [selectedItemQr, setSelectedItemQr] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: productsData } = useProducts(0, 200);
  const { data: itemsData } = useItems({ size: 200 });

  const products = productsData?.content ?? [];
  const items = itemsData?.content ?? [];

  const generateProductQR = async (sku: string) => {
    if (!sku) return;
    setGenerating(true);
    try {
      const base = api.defaults.baseURL || "";
      setPreviewUrl(`${base}/api/products/qr/${sku}`);
    } finally {
      setGenerating(false);
    }
  };

  const generateItemQR = async (qrCode: string) => {
    if (!qrCode) return;
    setGenerating(true);
    try {
      const base = api.defaults.baseURL || "";
      setPreviewUrl(`${base}/api/items/${qrCode}/label`);
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = (filename: string) => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <QrCode className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">QR Code Generator</h1>
          <p className="text-sm text-muted-foreground">
            Generate printable QR codes for products (catalog labels) or individual items (identity labels).
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tabs defaultValue="product" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="product" className="flex-1 gap-2">
              <Package className="size-4" />
              Product QR
            </TabsTrigger>
            <TabsTrigger value="item" className="flex-1 gap-2">
              <Layers className="size-4" />
              Item QR
            </TabsTrigger>
          </TabsList>

          {/* Product QR Tab */}
          <TabsContent value="product">
            <Card>
              <CardHeader>
                <CardTitle>Product Catalog Label</CardTitle>
                <CardDescription>
                  Encodes the SKU — identifies &quot;this is Product X&quot; not a specific unit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Select Product</p>
                  <Select
                    value={selectedProductSku}
                    onValueChange={(v) => {
                      setSelectedProductSku(v ?? "");
                      generateProductQR(v ?? "");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.sku}>
                          <span className="flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{p.sku}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProductSku && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                    <Package className="size-4 text-primary" />
                    <span className="font-mono text-faint">{selectedProductSku}</span>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => generateProductQR(selectedProductSku)}
                  disabled={!selectedProductSku || generating}
                >
                  Generate Product QR
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Item QR Tab */}
          <TabsContent value="item">
            <Card>
              <CardHeader>
                <CardTitle>Item Identity Label</CardTitle>
                <CardDescription>
                  Encodes the unique identity — traceable through the full lifecycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Select Item</p>
                  <Select
                    value={selectedItemQr}
                    onValueChange={(v) => {
                      setSelectedItemQr(v ?? "");
                      generateItemQR(v ?? "");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.qrCode}>
                          <span className="flex items-center gap-2">
                            <span>{item.code}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.productName || item.productSku || "No product"}
                            </span>
                            <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"} className="ml-auto">
                              {item.status}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItemQr && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                    <Layers className="size-4 text-primary" />
                    <span className="font-mono text-faint">{selectedItemQr}</span>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => generateItemQR(selectedItemQr)}
                  disabled={!selectedItemQr || generating}
                >
                  Generate Item QR
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>QR code preview and download</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {previewUrl ? (
              <>
                <div className="flex items-center justify-center rounded-lg border bg-white p-4">
                  <img
                    src={previewUrl}
                    alt="QR Code"
                    className="h-[250px] w-[250px] object-contain"
                    onError={() => setPreviewUrl(null)}
                  />
                </div>
                <Button onClick={() => downloadQR(`qr-${selectedProductSku || selectedItemQr}.png`)} className="w-full">
                  <Download className="mr-2 size-4" />
                  Download PNG
                </Button>
              </>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <QrCode className="size-6 text-primary" />
                  </div>
                  <p className="font-medium">Select a product or item</p>
                  <p className="text-sm">Choose from the dropdown to generate a QR code</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
