"use client";

import { useEffect, useState } from "react";

const DEFAULT_ORG_ID = "demo-org";

type StorageProvider = "s3" | "ipfs";

export function OrganizationAvatarBrandingCard() {
  const [orgId] = useState(DEFAULT_ORG_ID);
  const [provider, setProvider] = useState<StorageProvider>("s3");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const resp = await fetch(`/api/v3/org/metadata?orgId=${encodeURIComponent(orgId)}`);
        if (!resp.ok) return;

        const body = (await resp.json()) as {
          metadata: {
            logo_url?: string;
            logo_provider?: StorageProvider;
          } | null;
        };

        if (body.metadata?.logo_url) {
          setPreviewUrl(body.metadata.logo_url);
          setLogoUrl(body.metadata.logo_url);
        }

        if (body.metadata?.logo_provider) {
          setProvider(body.metadata.logo_provider);
        }
      } catch (error) {
        console.error("[OrganizationAvatarBrandingCard] failed to load metadata", error);
      }
    };

    loadMetadata();
  }, [orgId]);

  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);
    setStatus("");

    if (!file) {
      setPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image file.");
      return;
    }

    const dataUrl = await toDataUrl(file);
    setPreviewUrl(dataUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewUrl) {
      setStatus("Select a logo file first.");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading logo...");

    try {
      const uploadResp = await fetch("/api/v3/org/logo/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileData: previewUrl,
          provider,
        }),
      });

      if (!uploadResp.ok) {
        throw new Error(`Upload failed (${uploadResp.status})`);
      }

      const uploadBody = (await uploadResp.json()) as {
        logoUrl: string;
        previewUrl: string;
        provider: StorageProvider;
      };

      const metadataResp = await fetch("/api/v3/org/metadata", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          logo_url: uploadBody.logoUrl,
          logo_preview_url: uploadBody.previewUrl,
          logo_provider: uploadBody.provider,
        }),
      });

      if (!metadataResp.ok) {
        throw new Error(`Metadata update failed (${metadataResp.status})`);
      }

      setLogoUrl(uploadBody.logoUrl);
      setStatus("Organization avatar saved. New split-links will show this branding.");
    } catch (error) {
      console.error("[OrganizationAvatarBrandingCard] upload failed", error);
      setStatus("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
      <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">Organization Branding</p>
      <h2 className="font-heading mt-2 text-2xl md:text-3xl">Organization Avatar</h2>
      <p className="font-body mt-3 text-sm text-white/60">
        Upload a logo shown on split-links shared with recipients. Stored in organization metadata as <code>logo_url</code>.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Organization logo preview" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <span className="text-xs text-white/40">Logo preview</span>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-white/80">
            Storage Provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as StorageProvider)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="s3">S3</option>
              <option value="ipfs">IPFS</option>
            </select>
          </label>

          <label className="block text-sm text-white/80">
            Logo File
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400/20 file:px-3 file:py-2 file:text-cyan-200"
            />
          </label>

          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload Organization Avatar"}
          </button>

          {logoUrl && <p className="text-xs text-white/40 break-all">Stored logo_url: {logoUrl}</p>}
          {status && <p className="text-sm text-cyan-200">{status}</p>}
        </div>
      </div>
    </section>
  );
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
