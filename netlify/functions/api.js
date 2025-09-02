const express = require('express');
const serverless = require('serverless-http');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// Middleware para parsear JSON automáticamente de forma segura
app.use(express.json()); 

const router = express.Router();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Falta la variable de entorno GEMINI_API_KEY.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate-prayer', async (req, res) => {
  try {
    // Gracias a app.use(express.json()), req.body ya es un objeto
    const { peticion } = req.body;

    if (!peticion) {
      return res.status(400).json({ error: 'La petición no puede estar vacía.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Actúa como un teólogo y guía espiritual cristiano. Tu tarea es generar una oración cristiana extensa, de aproximadamente 60,000 a 70,000 caracteres... basada en esta petición: ${peticion}`; // El prompt completo

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // --- MEJORA IMPORTANTE: REGISTRO Y DEPURACIÓN ---
    // Esto nos mostrará en los logs de Netlify qué está respondiendo Google EXACTAMENTE.
    console.log('Respuesta completa de Google AI:', JSON.stringify(response, null, 2));

    const oracionGenerada = response.text();

    if (oracionGenerada === undefined || oracionGenerada === null) {
      // Si el texto es undefined, es probable que la respuesta fuera bloqueada.
      console.error('La respuesta de la IA fue bloqueada o no contiene texto.');
      throw new Error('La respuesta de la IA fue bloqueada o no contiene texto. Revisa los logs para ver la respuesta completa.');
    }
    
    res.json({ oracion: oracionGenerada });

  } catch (error) {
    console.error('Error en la función:', error);
    res.status(500).json({ error: 'Ocurrió un error en el servidor al generar la oración.' });
  }
});

app.use('/api/', router);

module.exports.handler = serverless(app);
