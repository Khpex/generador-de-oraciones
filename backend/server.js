const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Falta la variable de entorno GEMINI_API_KEY.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Función para dividir la oración en secciones temáticas
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

app.post('/generate-prayer', async (req, res) => {
  try {
    const { peticion } = req.body;
    if (!peticion || typeof peticion !== 'string' || peticion.trim().length === 0) {
      return res.status(400).json({ error: 'La petición no puede estar vacía.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Configuración para maximizar longitud
    const generationConfig = {
      maxOutputTokens: 8192, // Máximo razonable por respuesta
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    };

    const oracionCompleta = [];

    for (const seccion of seccionesOracion) {
      const prompt = `
Actúa como un teólogo cristiano profundamente formado en las Escrituras, la tradición patrística y la espiritualidad pastoral. Eres un guía espiritual sabio, compasivo y lleno de fe. Tu tarea es escribir una sección continua y profunda de una oración cristiana extensa, como parte de un todo coherente que gira en torno a la siguiente petición del creyente: "${peticion}".

Esta sección debe tratarse de: "${seccion}".

**Instrucciones específicas:**
1. Escribe en primera persona plural ("Señor, te adoramos...", "Te damos gracias...") o singular si es íntimo ("Ayúdame, Señor..."), manteniendo un tono reverente y devocional.
2. Usa lenguaje bíblico, imágenes poéticas, referencias a pasajes sagrados (sin citar versículos literalmente), y conceptos teológicos sólidos (gracia, redención, santidad, etc.).
3. Asegúrate de que esta sección fluya naturalmente desde la anterior y prepare el terreno para la siguiente. Usa conectores como "Y ahora, oh Dios...", "También te suplicamos...", "Por eso, en tu presencia...".
4. Longitud: aproximadamente 6,000–8,000 palabras por sección (máximo posible en esta respuesta).
5. No uses títulos, numeración ni separadores. Solo continúa el flujo de la oración.
6. Mantén un tono solemne, íntimo, lleno de esperanza y sumisión a la voluntad de Dios.
7. Si es una sección de súplica, incluye confesión, humildad, y confianza en Cristo como mediador.

Recuerda: esta no es una reflexión teológica fría, sino una oración viva, ardiente, espiritualmente profunda, que podría ser leída en un retiro, un culto íntimo o una hora de intercesión profunda.

Comienza la oración aquí:
      `;

      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        });

        const response = await result.response;
        const texto = response.text().trim();

        if (texto) {
          oracionCompleta.push(texto);
        }

        // Pausa opcional para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.warn(`Error generando sección "${seccion}":`, error.message);
        // Incluir mensaje de error suave en la oración (opcional)
        oracionCompleta.push(`(El servidor tuvo dificultades para generar esta sección, pero tu corazón es oído por Dios.)`);
      }
    }

    // Unir todas las secciones
    let oracionFinal = oracionCompleta.join('\n\n');

    // Validar longitud mínima
    const palabras = oracionFinal.trim().split(/\s+/).length;
    console.log(`Oración generada: ${palabras} palabras`);

    // Si es muy corta, añadir una sección final de cierre fuerte
    if (palabras < 50000) {
      const modeloCierre = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const promptCierre = `
Termina esta oración con un cierre profundamente pastoral, lleno de paz, esperanza y entrega al Señor, en tono de doxología final. 
Refuerza la confianza en que Dios escucha, ama y actúa según su perfecta voluntad. 
Longitud: 1000–2000 palabras. Sin títulos. Continúa el flujo.
      `;
      const result = await modeloCierre.generateContent(promptCierre);
      const cierre = await result.response.text();
      oracionFinal += '\n\n' + cierre.trim();
    }

    res.json({
      oracion: oracionFinal,
      palabras: oracionFinal.trim().split(/\s+/).length,
      secciones: seccionesOracion.length
    });

  } catch (error) {
    console.error('Error en el endpoint /generate-prayer:', error);
    res.status(500).json({
      error: 'Ocurrió un error en el servidor al generar la oración.',
      detalle: error.message
    });
  }
});

// Sirve el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
