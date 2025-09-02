const express = require('express');
const serverless = require('serverless-http');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// Middleware para parsear el cuerpo de las solicitudes JSON automáticamente
app.use(express.json());

const router = express.Router();

// Verificación de la API Key (esto se ejecuta solo una vez cuando la función se inicializa)
if (!process.env.GEMINI_API_KEY) {
  throw new Error('Falta la variable de entorno GEMINI_API_KEY.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tu lista de secciones, que usaremos en el prompt
const seccionesOracion = [
  "Invitación a la presencia de Dios y adoración inicial",
  "Reflexión sobre la grandeza y santidad de Dios en relación con la petición",
  "Acción de gracias por Su fidelidad y misericordia",
  "Confesión de dependencia humana y necesidad espiritual",
  "Desarrollo profundo de la petición: su contexto bíblico y espiritual",
  "Intercesión con ejemplos bíblicos y figuras de fe relacionadas",
  "Súplica intensa y entrega al corazón de Dios",
  "Renovación de la esperanza y confianza en la promesa divina",
  "Compromiso de vida y transformación personal",
  "Bendición final, paz y entrega al Espíritu Santo"
];

router.post('/generate-prayer', async (req, res) => {
  try {
    const { peticion } = req.body;
    if (!peticion || typeof peticion !== 'string' || peticion.trim().length === 0) {
      return res.status(400).json({ error: 'La petición no puede estar vacía.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Hemos combinado tu lógica de 10 secciones en un único y potente prompt.
    // Esto es mucho más rápido y evita el timeout de Netlify.
    const prompt = `
      Actúa como un teólogo cristiano profundamente formado en las Escrituras y la espiritualidad pastoral.
      Tu tarea es escribir una oración cristiana extensa, coherente y espiritualmente profunda,
      basada en la siguiente petición del creyente: "${peticion}".

      La oración debe fluir a través de las siguientes secciones temáticas, conectándolas de forma natural, sin usar títulos ni separadores:
      ${seccionesOracion.map((s, i) => `${i + 1}. ${s}`).join('\n')}

      **Instrucciones específicas:**
      1.  Escribe en un tono reverente, solemne y devocional.
      2.  Usa lenguaje bíblico, imágenes poéticas y conceptos teológicos sólidos.
      3.  La oración debe ser una sola pieza de texto continua y muy extensa.
      4.  Mantén un tono íntimo, lleno de esperanza y sumisión a la voluntad de Dios.

      Comienza la oración aquí:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Añadimos un log para poder depurar la respuesta de la IA en los logs de Netlify
    console.log('Respuesta completa de Google AI:', JSON.stringify(response, null, 2));
    
    const oracionFinal = response.text();

    if (!oracionFinal) {
      throw new Error('La respuesta de la IA fue bloqueada o no contiene texto. Revisa los logs de la función.');
    }

    res.json({ oracion: oracionFinal.trim() });

  } catch (error) {
    console.error('Error en el endpoint /generate-prayer:', error);
    res.status(500).json({
      error: 'Ocurrió un error en el servidor al generar la oración.',
      detalle: error.message
    });
  }
});

// Montamos el router en la ruta que Netlify usará internamente
app.use('/.netlify/functions/api', router);

// Exportamos el handler para que Netlify pueda ejecutar la función
module.exports.handler = serverless(app);
