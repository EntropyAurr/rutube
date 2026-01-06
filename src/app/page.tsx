import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Image src="/youtube.png" alt="logo" width={50} height={50} />
      <p className="text-xl font-semibold tracking-tight">RuTube</p>
    </div>
  );
}
