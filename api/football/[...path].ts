const API_BASE_URL = "https://v3.football.api-sports.io";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return jsonResponse(
        {
          connected: false,
          status: 500,
          fixturesCount: 0,
          error: "API_FOOTBALL_KEY is not configured in Vercel",
        },
        500,
      );
    }

    try {
      const incomingUrl = new URL(request.url);
      const prefix = "/api/football/";
      const path = incomingUrl.pathname.startsWith(prefix)
        ? incomingUrl.pathname.slice(prefix.length)
        : "";

      /*
       * La aplicación utiliza /api/football/health para comprobar
       * que API-Football está conectada.
       */
      if (path === "health") {
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/Madrid",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());

        const apiResponse = await fetch(
          `${API_BASE_URL}/fixtures?date=${encodeURIComponent(today)}`,
          {
            headers: {
              "x-apisports-key": apiKey,
              Accept: "application/json",
            },
          },
        );

        const data = await apiResponse.json();
        const fixtures = Array.isArray(data?.response) ? data.response : [];

        return jsonResponse(
          {
            connected: apiResponse.ok && !data?.errors?.length,
            status: apiResponse.status,
            fixturesCount: fixtures.length,
            todayDate: today,
            error: apiResponse.ok
              ? null
              : `API-Football returned HTTP ${apiResponse.status}`,
          },
          apiResponse.ok ? 200 : apiResponse.status,
        );
      }

      if (!path) {
        return jsonResponse(
          {
            error: "Missing API-Football endpoint",
          },
          400,
        );
      }

      const targetUrl = new URL(`${API_BASE_URL}/${path}`);

      incomingUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
      });

      const apiResponse = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: {
          "x-apisports-key": apiKey,
          Accept: "application/json",
        },
      });

      const body = await apiResponse.text();

      return new Response(body, {
        status: apiResponse.status,
        headers: {
          "Content-Type":
            apiResponse.headers.get("Content-Type") ??
            "application/json; charset=utf-8",
          "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
        },
      });
    } catch (error) {
      return jsonResponse(
        {
          connected: false,
          status: 500,
          fixturesCount: 0,
          error:
            error instanceof Error
              ? error.message
              : "Unknown API-Football proxy error",
        },
        500,
      );
    }
  },
};
