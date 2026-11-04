"use client";

import { IconTile } from "@/components/IconTile/IconTile";
import { FileSpreadsheet, X } from "lucide-react";
import { useRef } from "react";
import { ActionBar, CardFooter } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Amber } from "@/components/InstructorContent/Amber";
import { Notice } from "@/components/Notice/Notice";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { sizeText } from "@/lib/content-import";

export const CHOOSE_TITLE = "Choose a document";
export const CHOOSE_HELP = "Excel (.xlsx), up to 10 MB";
export const IMAGES_LINE = "You can also add them later.";
export const ACCEPT = ".xlsx";
export const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp";

export const HELPER =
  "Upload one Excel document. We will read it and prepare a draft topic for you to review.";
/**
 * The small x of a row (DESIGN.md: Instructor content flow polish): a 32px light tile in a 44px tap
 * area, in the row, vertically centred, 12px from the row's right edge (the row has 12px padding and
 * the button reaches 6px into it).
 */
function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      data-remove
      className="-mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center focus-visible:outline-2"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-tile-bg text-neutral-tile-ink"
      >
        <X size={16} strokeWidth={2.25} />
      </span>
    </button>
  );
}

/**
 * Import content (DESIGN.md: One document in, a draft topic out): ONE large card "Choose a document"
 * that becomes ONE file card (name, size, a corner x), the two plain links "Download blank template" and
 * "Try an example", the optional images, plain messages
 * under the file card, and the pinned Primary "Import and review" above Secondary "Cancel". Nothing
 * is uploaded: the document is read on this device.
 */
export function PackageImportView({
  file,
  message = "",
  images,
  imageMessage = "",
  notice = "",
  onFile,
  onRemove,
  onSample,
  onImages,
  onRemoveImage,
  onImport,
  onCancel,
}: {
  file: { name: string; size: number } | null;
  /** The plain message under the file card; any message blocks the Primary. */
  message?: string;
  /** The pictures added so far: a name and a thumbnail. */
  images: { name: string; src: string }[];
  imageMessage?: string;
  /** Replace document: what the new document replaces. */
  notice?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  onSample: () => void;
  onImages: (files: File[]) => void;
  onRemoveImage: (name: string) => void;
  onImport: () => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const pictures = useRef<HTMLInputElement>(null);
  const canImport = file !== null && message === "";
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title="Import content"
        helper={HELPER}
        back={{ label: "Back to Content", href: "/instructor/content" }}
      />
      <div className="contents idesk:mx-auto idesk:mt-4 idesk:flex idesk:w-full idesk:max-w-[640px] idesk:flex-col idesk:gap-6 idesk:rounded-card idesk:border idesk:border-selectable-stroke idesk:bg-card idesk:p-8 idesk:shadow-(--card-shadow)">
        {notice && (
          <Notice variant="info" clamp={false} title="Replace document">
            {notice}
          </Notice>
        )}

        <section aria-label="Document" className="flex flex-col gap-3">
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            aria-label="Choose a document"
            data-file-input
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              if (chosen) onFile(chosen);
              event.target.value = "";
            }}
          />
          {file ? (
            <div
              data-file-card
              className="flex items-center gap-3 rounded-card border border-selectable-stroke bg-card p-3"
            >
              <IconTile size="compact">
                <FileSpreadsheet strokeWidth={2} />
              </IconTile>
              <span className="flex min-w-0 flex-1 flex-col">
                <span data-file-name className="type-body-strong break-words">
                  {file.name}
                </span>
                <span className="type-small text-text-secondary">{sizeText(file.size)}</span>
              </span>
              <RemoveButton label="Remove file" onClick={onRemove} />
            </div>
          ) : (
            <button
              type="button"
              data-drop-area
              onClick={() => input.current?.click()}
              className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-placeholder-stroke bg-card p-[var(--gutter,1rem)] text-center focus-visible:outline-2"
            >
              <FileSpreadsheet
                size={28}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-text-secondary"
              />
              <span className="type-body-strong">{CHOOSE_TITLE}</span>
              <span className="type-small text-text-secondary">{CHOOSE_HELP}</span>
            </button>
          )}
          {message && <Amber id="import-message">{message}</Amber>}
          <div data-actions-row className="-mx-3 flex items-center justify-between">
            <ButtonLink
              href="/templates/guide-template.xlsx"
              download="guide-template.xlsx"
              variant="tertiary"
              wide={false}
            >
              Download blank template
            </ButtonLink>
            <Button variant="tertiary" onClick={onSample}>
              Try an example
            </Button>
          </div>
        </section>

        {file && (
          <section aria-labelledby="images-label" className="flex flex-col gap-3">
            <h2 id="images-label" className="type-label text-text-secondary">
              IMAGES (OPTIONAL)
            </h2>
            <input
              ref={pictures}
              type="file"
              multiple
              accept={IMAGE_ACCEPT}
              aria-label="Choose images"
              data-image-input
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                onImages(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            <Button variant="secondary" onClick={() => pictures.current?.click()}>
              Add images
            </Button>
            {images.length > 0 ? (
              <ul data-image-rows className="flex flex-col gap-2">
                {images.map((image) => (
                  <li
                    key={image.name}
                    data-image-row
                    className="flex items-center gap-3 rounded-panel border border-selectable-stroke bg-card p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-[8px] object-cover"
                    />
                    <span className="type-small min-w-0 flex-1 break-words">{image.name}</span>
                    <RemoveButton
                      label={`Remove ${image.name}`}
                      onClick={() => onRemoveImage(image.name)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="type-small text-text-secondary">{IMAGES_LINE}</p>
            )}
            {imageMessage && <Amber>{imageMessage}</Amber>}
          </section>
        )}

        <CardFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!canImport} onClick={onImport}>
            Import and review
          </Button>
        </CardFooter>
      </div>

      <ActionBar hideOnDesk>
        <Button disabled={!canImport} onClick={onImport}>
          Import and review
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </ActionBar>
    </div>
  );
}
