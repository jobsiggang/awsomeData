export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  try {
    const res = await fetch(`${process.env.SCHOOL_API_URL}?name=${name}&key=${process.env.SCHOOL_API_KEY}`);
    const data = await res.json();
    return new Response(JSON.stringify({ school: data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
