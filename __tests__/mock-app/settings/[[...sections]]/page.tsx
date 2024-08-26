export default function Settings({ params }: { params: { sections?: string[] } }) {
  return <h1>Settings: {params.sections?.join(', ') || 'General'}</h1>;
}