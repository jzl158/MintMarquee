import type { GetStaticProps, GetStaticPaths } from 'next'
import Layout from "../../components/Layout";
import ProductDetail from "../../components/ProductDetail";
import { fetchData } from "../../utils/fetchData";
import { useCartContext } from "../../context/CartContext";
import type { Product } from "../../types/product";

function Model({ details }: { details: Product }) {
  const { addToCart } = useCartContext();

  const handleAddToCart = async (product: Product, customizations?: any) => {
    // Create cart item from product
    const cartItem = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: customizations?.quantity || 1,
      url: product.thumbnails?.medium || product.images?.[0] || `/models/${product.id}/thumbnail@m.jpg`,
      product,
    };

    addToCart(cartItem, customizations);
  };

  return (
    <Layout>
      <ProductDetail
        product={details}
        isPurchased={false}
        onAddToCart={handleAddToCart}
      />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async (props) => {
  const details = await fetchData(props.params.id as string);

  return {
    props: {
      details
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await fetchData();

  return {
    paths: docs.map(doc => ({
      params: { id: `${doc.id}` }
    })),
    fallback: false
  }
}

export default Model;
