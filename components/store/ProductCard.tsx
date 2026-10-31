import Link from "next/link";
import { Plus } from "lucide-react";
import type { ProductCardProps } from "@/types/types";

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="popularProductCard">
      <div className="productCardMedia">
        <div className="productCardActions">
          <Link
            href="/portal/orders"
            className="productAction productCartAction"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus aria-hidden="true" />
            Cart
          </Link>
          <Link
            href="/portal/orders/new"
            className="productAction productQuoteAction"
            aria-label={`Request a quote for ${product.name}`}
          >
            <Plus aria-hidden="true" />
            Quote
          </Link>
        </div>
      </div>
      <div className="productCardDetails">
        {product.lowStock ? (
          <p className="productStockWarning">
            <span aria-hidden="true">!</span> Low Stock
          </p>
        ) : null}
        <h3>{product.name}</h3>
        <p className="productSku">SKU: {product.sku}</p>
        <p className="productPrice">
          ${product.price} <span>/each</span>
        </p>
      </div>
    </article>
  );
}
