import Image from "next/image";
import CedarShopLogo from "@/images/CedarShopLogo.png";

export default function BrandLogo() {
  return (
    <div className="brand">
      <div className="brandIcon brandIconImage">
        <Image
          src={CedarShopLogo}
          alt="Cedar Shop logo"
          width={120}
          height={120}
          priority
        />
      </div>
    </div>
  );
}
