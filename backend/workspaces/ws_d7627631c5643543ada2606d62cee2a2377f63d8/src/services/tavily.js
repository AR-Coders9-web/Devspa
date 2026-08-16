const API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

export async function searchStartup(query) {
  try {
    // Agar query empty hai to Gemini ko directly run hone do
    if (!query || query.trim().length < 5) {
      return {
        query,
        answer: "",
        results: [],
      };
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: API_KEY,
        query: query.trim(),
        topic: "general",
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
        include_images: false,
      }),
    });

    const data = await response.json();

    console.log("========== TAVILY ==========");
    console.log(data);
    console.log("============================");

    // Agar Tavily fail ho jaye to analysis continue kare
    if (!response.ok) {
      console.warn("Tavily failed. Continuing without web search.");
      return {
        query,
        answer: "",
        results: [],
      };
    }

    return data;

  } catch (err) {
    console.warn("Tavily Error:", err);

    // Analysis ko stop mat karo
    return {
      query,
      answer: "",
      results: [],
    };
  }
}