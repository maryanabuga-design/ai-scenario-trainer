import Image from "next/image";
import type { ContentImage as ContentImageData } from "@/lib/scenario";

/**
 * The optional picture above a situation or question: full width, 4:3, 16px radius, cover, a sand
 * placeholder while it loads. Nothing is drawn without an image.
 */
export function ContentImage({ image }: { image?: ContentImageData }) {
  if (!image) return null;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-secondary-sand">
      <Image src={image.src} alt={image.alt} fill sizes="430px" className="object-cover" />
    </div>
  );
}
