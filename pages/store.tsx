import type { GetStaticProps } from 'next'
import Link from "next/link";
import Image from "next/image";

import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { fetchData } from "../utils/fetchData";
import type { Product } from "../types/product";

function Store({ products }: { products: Product[] }) {
  const getProductTypeBadge = (type: string) => {
    const badges = {
      physical: { label: '3D Print', color: '#2196F3' },
      digital: { label: 'Download', color: '#9C27B0' },
      custom: { label: 'Custom', color: '#FF9800' },
      gallery: { label: 'Product', color: '#4CAF50' },
    };
    return badges[type] || badges.gallery;
  };
  return (
    <Layout>
      <article className="pt5 bg-black white ph3">
        <a className="link white tc">
          <p>
            <i className="material-icons md-48 v-top">store</i>
          </p>
          <h1 className="tc f3 mb4">Model Store</h1>
        </a>
        <div className="pa2 flex flex-wrap">
          {Array.isArray(products) &&
            products.map(product => {
              const badge = getProductTypeBadge(product.type);
              const thumbnailUrl = product.thumbnails?.medium || product.images?.[0] || `/models/${product.id}/thumbnail@m.jpg`;

              return (
                <div
                  style={{ height: "400px" }}
                  className="fl w-100 w-50-m w-33-l pa2"
                  key={product.id}
                >
                  <Link href={`/model/${product.id}`}>
                    <div className="db link dim tc white relative">
                      {/* Product Type Badge */}
                      <div
                        className="absolute top-1 right-1 pa2 br2 f7 fw6 white z-1"
                        style={{ backgroundColor: badge.color }}
                      >
                        {badge.label}
                      </div>

                      <Image
                        height={200}
                        width={300}
                        src={thumbnailUrl}
                        alt={product.name}
                        className="w-100 db outline black-10"
                      />

                      <dl className="mt2 f6 lh-copy">
                        <dt className="clip">Name</dt>
                        <dd className="ml0 white truncate w-100 fw6">
                          {product.name}
                        </dd>
                        <dt className="clip">Price</dt>
                        <dd className="ml0 light-green f5 fw6">
                          ${product.price.toFixed(2)}
                        </dd>
                        <dt className="clip">Description</dt>
                        <dd className="ml0 gray truncate w-100">
                          {product.description}
                        </dd>
                      </dl>
                    </div>
                  </Link>
                </div>
              );
            })}
        </div>
      </article>
      <Footer />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const products = await fetchData();

  return {
    props: {
      products
    },
  };
}


export default Store;
