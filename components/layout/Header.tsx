import Link from "next/link";
import Image from "next/image";
import HeaderAuthArea from "./HeaderAuthArea";
import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "3px solid #030505",
      }}
    >
      <div className="max-w-3xl mx-auto px-5 h-[64px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="Swap Books"
            width={36}
            height={36}
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <HeaderAuthArea />
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
