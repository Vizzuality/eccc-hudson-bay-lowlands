const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    const apiHealth = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          status: "unhealthy",
          services: {
            client: "healthy",
            api: apiHealth.services?.api || "unhealthy",
            database: apiHealth.services?.database || "unhealthy",
          },
        },
        { status: 503 },
      );
    }

    return Response.json({
      status: "healthy",
      services: {
        client: "healthy",
        api: apiHealth.services?.api || "healthy",
        database: apiHealth.services?.database || "healthy",
      },
    });
  } catch {
    return Response.json(
      {
        status: "unhealthy",
        services: {
          client: "healthy",
          api: "unhealthy",
          database: "unknown",
        },
      },
      { status: 503 },
    );
  }
}
