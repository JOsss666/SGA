
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function send_API_AI(prompt,userInfo,attached) {
    try {
        const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "openai/gpt-4o-mini", // puedes cambiar a cualquier modelo soportado
            messages: [
            { role: "system", content: `
                Eres un asistente de una APP de gestion Administrativa
                y respondes a un usuario con el nombre ${userInfo.user_name}. de forma amable
                Responde SIEMPRE y unicamente en formato JSON sin información adicional basandote en esta estructura:
                    [
                        {type:"MainTitle",content:"..."},
                        {type:"SubTitle",content:"..."},
                        {type:"TextPlain",content"..."}
                    ]
                IMPORTANTE no coloques texto afuera del formato ej:json porque no sirve el parse,
                puedes crear multiples Subtitle y textPlain si es necesario lo importante es que se
                solucione la dua.
                ` },
            { role: "user", content: prompt },
            ...(attached
            ? [{
                role: "user",
                content: `Adjunto la siguiente información:\n\n${JSON.stringify(attached)}`
            }]
            : [])
            ]
        },
        {
            headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            // Opcional: para mostrar tu app en el panel de OpenRouter
            "HTTP-Referer": "https://tusitio.com",
            "X-Title": "Mi App con OpenRouter"
            }
        }
        );
        console.log(response.data.choices[0].message.content);
        return([true,response.data.choices[0].message.content])
    } catch (error) {
        console.error("Error en la petición:", error.response?.data || error.message);
        return([false,''])
    }
}

