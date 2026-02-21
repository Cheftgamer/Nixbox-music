from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
import ytmusicapi
import yt_dlp
import os

app = Flask(__name__, template_folder='.', static_folder='.')

ytmusic = ytmusicapi.YTMusic()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/estilo.css')
def estilo():
    return send_from_directory('.', 'estilo.css')

@app.route('/script.js')
def script_js():
    return send_from_directory('.', 'script.js')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('.', 'favicon.ico')

@app.route('/search', methods=['POST'])
def search():
    query = request.json.get('query')
    results = {'youtube': []}
    import re
    youtube_url_pattern = r'(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})'
    match = re.match(youtube_url_pattern, query.strip())
    if match:
        video_id = match.group(4)
        try:
            song_info = ytmusic.get_song(video_id)
            if song_info:
                audio_url = get_audio_url(f"https://www.youtube.com/watch?v={video_id}")
                results['youtube'].append({
                    'name': song_info['title'],
                    'artist': song_info['artists'][0]['name'] if song_info['artists'] else 'Unknown',
                    'album': song_info.get('album', {}).get('name', 'Unknown') if song_info.get('album') else 'Unknown',
                    'url': f"https://music.youtube.com/watch?v={video_id}",
                    'audio_url': audio_url,
                    'videoId': video_id
                })
        except:
            pass
    else:
        try:
            youtube_results = ytmusic.search(query, filter='songs', limit=5)
            for song in youtube_results:
                audio_url = get_audio_url(f"https://www.youtube.com/watch?v={song['videoId']}")
                results['youtube'].append({
                    'name': song['title'],
                    'artist': song['artists'][0]['name'] if song['artists'] else 'Unknown',
                    'album': song.get('album', 'Unknown'),
                    'url': f"https://music.youtube.com/watch?v={song['videoId']}",
                    'audio_url': audio_url,
                    'videoId': song['videoId']
                })
        except:
            pass

    return jsonify(results)

def get_audio_url(url):
    try:
        ydl_opts = {
            'format': 'bestaudio/best',
            'extractaudio': True,
            'audioformat': 'mp3',
            'outtmpl': '-',
            'quiet': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info['url']
    except Exception as e:
        print(f"Error getting audio URL: {e}")
        return None

@app.route('/download/<video_id>')
def download(video_id):
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        output_path = os.path.join('downloads', f"{video_id}.mp3")
        ydl_opts = {
            'format': 'bestaudio/best',
            'extractaudio': True,
            'audioformat': 'mp3',
            'outtmpl': output_path,
            'quiet': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return send_file(output_path, as_attachment=True, mimetype='audio/mpeg')
    except Exception as e:
        return f"Error al descargar: {str(e)}", 500

if __name__ == '__main__':
    if not os.path.exists('downloads'):
        os.makedirs('downloads')
    app.run(debug=True)