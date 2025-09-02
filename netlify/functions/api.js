    1         const express = require('express');
    2         const serverless = require('serverless-http');
    3         const { GoogleGenerativeAI } = require('@google/generative-ai');
    4 
    5         const app = express();
    6         const router = express.Router();
    7 
    8         if (!process.env.GEMINI_API_KEY) {
    9           throw new Error('Falta la variable de entorno GEMINI_API_KEY.');
   10         }
   11         const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
   12 
   13         router.post('/generate-prayer', async (req, res) => {
   14           try {
   15             // Express no parsea el body automáticamente en este entorno, lo leemos manualmente
   16             const body = JSON.parse(req.body);
   17             const { peticion } = body;
   18 
   19             if (!peticion) {
   20               return res.status(400).json({ error: 'La petición no puede estar vacía.' });
   21             }
   22             const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
   23             const prompt = `Actúa como un teólogo y guía espiritual cristiano. Tu tarea es generar 
      una oración cristiana extensa, de aproximadamente 60,000 a 70,000 caracteres...`; // El prompt 
      completo
   24 
   25             const result = await model.generateContent(prompt);
   26             const response = await result.response;
   27             const oracionGenerada = response.text();
   28 
   29             res.json({ oracion: oracionGenerada });
   30           } catch (error) {
   31             console.error('Error en la función:', error);
   32             res.status(500).json({ error: 'Ocurrió un error en el servidor al generar la oración.'
      });
   33           }
   34         });
   35 
   36         app.use('/api/', router);
   37 
   38         module.exports.handler = serverless(app);
