# Nixbox Music - Descargador de Música desde YouTube

Una aplicación web moderna para descargar música desde YouTube y crear playlists personalizadas.

## Características

✨ **Buscar y descargar música** desde YouTube  
🎵 **Reproductor de audio integrado** con controles totales  
📋 **Gestión de playlists** - crea y organiza tus playlists  
🔀 **Shuffle y repeat** - controla el modo de reproducción  
📱 **Diseño responsive** - funciona en cualquier dispositivo  
🎨 **Interfaz moderna** con colores personalizados  

## Requisitos

- Python 3.8+
- pip (gestor de paquetes de Python)
- Navegador web moderno

## Instalación

1. **Clona el repositorio**
```bash
git clone https://github.com/Cheftgamer/Nixbox-music.git
cd Nixbox-music
```

2. **Crea un entorno virtual**
```bash
python -m venv .venv
.venv\Scripts\activate  # En Windows
# source .venv/bin/activate  # En Mac/Linux
```

3. **Instala las dependencias**
```bash
pip install -r requirements.txt
```

4. **Ejecuta el servidor**
```bash
python script.py
```

5. **Abre el navegador**
```
http://localhost:5000
```

## Cómo usar

### Buscar canciones
1. Escribe el nombre de la canción en el cuadro de búsqueda
2. Presiona "Buscar"
3. Selecciona la canción que deseas

### Reproducir música
- Haz clic en el botón de reproducción ▶️
- Usa los controles: pausa, siguiente, anterior
- Descarga la música con el botón "Descargar"

### Crear Playlists
1. Haz clic en "Agregar a Playlist"
2. Crea una nueva playlist o selecciona una existente
3. Gestiona tu playlist en la barra lateral

### Modos de reproducción
- **Shuffle**: Reproduce las canciones en orden aleatorio
- **Repeat**: Repite la playlist automáticamente

## Tecnologías usadas

**Frontend:**
- HTML5
- CSS3 (Responsive Design)
- JavaScript Vanilla

**Backend:**
- Flask (Python)
- yt-dlp (Descarga desde YouTube)

## Estructura del proyecto

```
Nixbox-music/
├── index.html       # Página principal
├── estilo.css       # Estilos y diseño
├── script.js        # Lógica del cliente
├── script.py        # Backend Flask
├── .gitignore       # Archivos ignorados en Git
└── README.md        # Este archivo
```

## Notas importantes

- Las canciones descargadas se guardan en la carpeta `downloads/`
- Las playlists se guardan en el navegador (localStorage)
- Requiere conexión a internet para descargar desde YouTube

## Solución de problemas

### "Módulo no encontrado"
```bash
pip install flask yt-dlp
```

### Puerto 5000 en uso
Cambia el puerto en `script.py`:
```python
if __name__ == '__main__':
    app.run(debug=True, port=5001)
```

### No se descarga la música
- Verifica conexión a internet
- Intenta con otro video de YouTube
- Revisa que yt-dlp esté instalado: `pip install --upgrade yt-dlp`

## Autor

Cheftgamer

## Licencia

Este proyecto es de código abierto bajo licencia MIT.

---

¿Tienes preguntas? Abre un Issue en el repositorio.
