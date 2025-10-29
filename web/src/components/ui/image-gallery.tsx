import Image from "next/image";

type ImageGalleryProps = {
  images?: { src: string; alt: string }[];
  height?: number;
};

export default function ImageGallery({
  images = [
    { src: "/presentation/mute3.webp", alt: "Mute 3" },
    { src: "/images/boothA.png", alt: "Booth A" },
    { src: "/presentation/mappage.png", alt: "Map Page" },
    { src: "/presentation/profilepage.png", alt: "Profile Page" },
  ],
  height = 400,
}: ImageGalleryProps) {
  return (
    <div className="w-full">
      <div
        className="flex items-center gap-2 w-full rounded-xl overflow-hidden"
        style={{ height }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative group flex-grow transition-all w-56 rounded-lg overflow-hidden h-full duration-500 hover:w-full"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
              priority={idx === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}


