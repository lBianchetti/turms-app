const GEMINI_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

export const callGeminiAPI = async (prompt) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.warn("Resposta da API Gemini com estrutura inesperada:", result);
            throw new Error("Resposta da API inválida ou vazia.");
        }
    } catch (error) {
        console.error("Falha ao chamar a API Gemini:", error);
        throw error;
    }
};
