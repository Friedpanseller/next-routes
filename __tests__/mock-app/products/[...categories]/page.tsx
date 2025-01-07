export default function Products({ params }: { params: { categories: string[] } }) {
  return <h1>Products: {params.categories.join(', ')}</h1>;
}