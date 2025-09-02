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
    
// Sirve los archivos estáticos del frontend desde la carpeta 'frontend'
            app.use(express.static(path.join(__dirname, '../frontend')));
    
            app.post('/generate-prayer', async (req, res) => {
              try {
                const { peticion } = req.body;
                if (!peticion) {
                  return res.status(400).json({ error: 'La petición no puede estar vacía.' });
                }
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `Actúa como un teólogo y guía espiritual cristiano. Tu tarea es generar una oración cristiana 
      extensa, de aproximadamente 60,000 a 70,000 caracteres. La oración debe ser única, profunda, pastoral y completamente centrada
      en la siguiente petición del usuario: \"${peticion}\". La oración debe tener una estructura coherente: un inicio que invite a 
      la oración, un cuerpo que desarrolle la petición a través de la adoración, el agradecimiento, la reflexión y la súplica 
      (siempre en el contexto del tema principal), y un cierre que ofrezca paz y bendición. El tono debe ser solemne, inspirador y 
      lleno de fe. No incluyas títulos, solo el cuerpo de la oración.`;
    
                const result = await model.generateContent(prompt);
                const response = await result.response;
              const oracionGenerada = response.text();
   
                res.json({ oracion: oracionGenerada });
              } catch (error) {
                console.error('Error en el endpoint /generate-prayer:', error);
                res.status(500).json({ error: 'Ocurrió un error en el servidor al generar la oración.' });
              }
            });
    
           // Cualquier otra ruta, la mandamos al index.html
            app.get('*', (req, res) => {
              res.sendFile(path.join(__dirname, '../frontend/index.html'));
            });
    
           app.listen(port, () => {
              console.log(`Servidor escuchando en http://localhost:${port}`);
            });
