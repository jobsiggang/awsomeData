export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");

  try {
    const res = await fetch(`${process.env.WEATHER_API_URL}?location=${location}&key=${process.env.WEATHER_API_KEY}`);
    const data = await res.json();
    return new Response(JSON.stringify({ weather: data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
