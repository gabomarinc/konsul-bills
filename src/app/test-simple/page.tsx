import Link from "next/link"

export default function TestSimplePage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'blue' }}>Test Simple Page</h1>
      <p>If you can see this, basic routing works.</p>
      <div style={{ backgroundColor: 'lightblue', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
        <p>This is a test div with styling.</p>
      </div>
      <Link href="/" style={{ color: 'green', textDecoration: 'underline' }}>Go to Home</Link>
    </div>
  )
}




