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
        500
      );
    }

    try {
      const incomingUrl = new URL(request.url);

      // Obtiene fixtures, teams, standings, status, etc.
      const endpoint = incomingUrl.pathname.replace(
        /^\/api\/football\/?/,
        ""
      );

      if (!endpoint) {
        return jsonResponse(
          {
            connected: false,
            status: 400,
            error: "Football API endpoint is missing",
          },
          400
        );
      }

      const targetUrl = new URL(`${API_BASE_URL}/${endpoint}`);

      // Copia únicamente los parámetros válidos.
      // __path es un parámetro interno de Vercel y no debe enviarse.
      incomingUrl.searchParams.forEach((value, key) => {
        if (key !== "__path" && key !== "...path") {
          targetUrl.searchParams.append(key, value);
        }
      });

      const apiResponse = await fetch(targetUrl.toString(), {
        method: "GET",
        headers: {
          "x-apisports-key": apiKey,
        },
      });

      const data = await apiResponse.json();

      return jsonResponse(data, apiResponse.status);
    } catch (error) {
      return jsonResponse(
        {
          connected: false,
          status: 500,
          error:
            error instanceof Error
              ? error.message
              : "Failed to contact API-Football",
        },
        500
      );
    }
  },
};
