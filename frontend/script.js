document.addEventListener('DOMContentLoaded', () => {
    const generarBtn = document.getElementById('generarBtn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('spinner');
    const peticionesInput = document.getElementById('peticiones');
    const resultadoTextarea = document.getElementById('resultado');
    const copiarBtn = document.getElementById('copiarBtn');
    const copyAlert = document.getElementById('copy-alert');

    generarBtn.addEventListener('click', () => {
        // Deshabilitar botón y mostrar spinner
        generarBtn.disabled = true;
        btnText.textContent = 'Generando...';
        spinner.classList.remove('d-none');
        resultadoTextarea.value = ''; // Limpiar resultado anterior

        const peticiones = peticionesInput.value;
        
        // Usar setTimeout para evitar que la UI se congele durante la generación
        setTimeout(() => {
            try {
                fetch('/generate-prayer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ peticion: peticiones })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    resultadoTextarea.value = data.oracion;
                })
                .catch(error => {
                    console.error('Error durante la generación de la oración:', error);
                    resultadoTextarea.value = `Ocurrió un error al contactar al servidor: ${error.message}. Asegúrate de que el backend esté funcionando correctamente.`;
                })
                .finally(() => {
                    // Habilitar botón y ocultar spinner
                    generarBtn.disabled = false;
                    btnText.textContent = 'Generar Oración';
                    spinner.classList.add('d-none');
                });
            } catch (error) {
                console.error('Error durante la generación de la oración:', error);
                resultadoTextarea.value = 'Ocurrió un error al generar la oración. Por favor, inténtalo de nuevo.';
            }

            // Habilitar botón y ocultar spinner
            generarBtn.disabled = false;
            btnText.textContent = 'Generar Oración';
            spinner.classList.add('d-none');
        }, 50); // 50ms para permitir que la UI se actualice
    });

    copiarBtn.addEventListener('click', () => {
        resultadoTextarea.select();
        document.execCommand('copy');

        // Mostrar alerta de copiado
        copyAlert.classList.remove('d-none');
        setTimeout(() => {
            copyAlert.classList.add('d-none');
        }, 2000);
    });
});
