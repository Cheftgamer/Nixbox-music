# Nixbox Music - Descargador de Música

Una aplicación web moderna completamente en JavaScript para buscar, reproducir y descargar música de forma fácil y rápida.

## ✨ Características

- 🔍 **Buscar música** - Búsqueda rápida y precisa
- 🎵 **Reproductor integrado** - Reproduce directamente en el navegador
- 📋 **Gestión de playlists** - Crea, edita y elimina playlists
- 💾 **Descarga de canciones** - Descarga canciones en formato MP3
- 📱 **Diseño responsive** - Funciona en cualquier dispositivo
- 🎨 **Interfaz moderna** - Colores y diseño profesional
- ⚡ **Sin dependencias backend** - Todo funciona en el navegador

## 🚀 Inicio rápido

2. Abre el archivo en tu navegador
```bash
# En Windows
start index.html

# En Mac
open index.html

# En Linux
xdg-open index.html
```

O simplemente abre `index.html` con tu navegador favorito.

## 📖 Cómo usar

### Buscar canciones
1. Escribe el nombre de la canción en el cuadro de búsqueda
2. Presiona "Buscar" o Enter
3. Selecciona la canción que deseas

### Reproducir música
- Haz clic en **▶ Play** para reproducir
- Usa los controles **Pausar**, **Reanudar** y **Detener**

### Crear y gestionar playlists
1. Abre el modal "Agregar a Playlist"
2. Crea una nueva o selecciona una existente
3. Gestiona tu playlist desde la barra lateral con **+ Playlist**

### Descargar música
- Haz clic en **⬇ Descargar** en cualquier canción
- El archivo se descargará como MP3

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **API**: JiosaavnAPI (búsqueda y streaming de música)
- **Almacenamiento**: LocalStorage (navegador)

## 📦 Características técnicas

- 🔒 **Sin servidor backend** - Todo funciona en el navegador
- 💾 **Persistencia local** - Las playlists se guardan en tu navegador
- 🌐 **Basado en API pública** - Acceso a millones de canciones
- 📱 **Responsive Design** - Optimizado para móvil, tablet y desktop

## ⚙️ Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a Internet
- JavaScript habilitado

## 📝 Estructura del proyecto

```
Nixbox-music/
├── index.html       # Página principal
├── estilo.css       # Estilos CSS3
├── script.js        # Lógica JavaScript pura
├── favicon.ico      # Icono del sitio
├── .gitignore       # Archivos ignorados
└── README.md        # Este archivo
```

## 🎯 API Utilizada

**JiosaavnAPI**
- Proveedor: https://jiosaavn-api.vercel.app
- Características: Búsqueda ilimitada, descargas de alta calidad, sin autenticación

## 📝 Notas

- Las playlists se guardan en el **localStorage** de tu navegador
- Cada navegador/dispositivo tiene sus propias playlists
- Las canciones se reproducen directamente desde la API
- No se requiere instalación ni configuración

## 🐛 Solución de problemas

**"No puedo reproducir las canciones"**
- El navegador puede estar bloqueando la reproducción por CORS
- Intenta con otro navegador
- Verifica tu conexión a Internet

**"Las playlists se borraron"**
- Se guardan en localStorage del navegador
- Borrar datos del navegador elimina las playlists
- Exporta tus playlists regularmente

**"No encuentra mi canción"**
- Intenta con otro nombre o artista
- Verifica que no haya errores de tipografía
- La API puede tardar segundos en responder

## 📄 Licencia

Proyecto de código abierto

## 👤 Autor

**Cheftgamer**

---

¿Preguntas? Abre un Issue en el repositorio: https://github.com/Cheftgamer/Nixbox-music
