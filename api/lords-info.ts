const LORDS_TOKEN_ADDRESS = "0x686f2404e77ab0d9070a46cdfb0b7fecdd2318b0";

function methodNotAllowed() {
  return new Response(
    JSON.stringify({
      error: "Method Not Allowed",
      allowed: ["GET"],
    }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Allow: "GET",
      },
    }
  );
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  const apiKey = process.env.ETHPLORER_APIKEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ETHPLORER_APIKEY is not configured" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  const upstreamUrl = `https://api.ethplorer.io/getTokenInfo/${LORDS_TOKEN_ADDRESS}?apiKey=${apiKey}&chainId=1`;
  const upstream = await fetch(upstreamUrl);
  const payload = await upstream.text();

  return new Response(payload, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
