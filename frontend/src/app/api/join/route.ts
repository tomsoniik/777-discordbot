import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    
    if (!ip) {
        return new Response('Brak IP serwera', { status: 400 });
    }

    const html = `
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Łączenie z serwerem...</title>
            <style>
                body {
                    background-color: #0f1115;
                    color: white;
                    font-family: 'Inter', sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }
                .loader {
                    border: 4px solid rgba(255, 255, 255, 0.1);
                    border-left-color: #7289da;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                a { color: #7289da; text-decoration: none; margin-top: 20px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="loader"></div>
            <h2>Uruchamianie Unturned...</h2>
            <p>Jeśli gra nie otworzyła się automatycznie, kliknij poniższy przycisk:</p>
            <a href="steam://run/304930//+connect%20${ip}">Ręczne Dołączenie (Otwórz Steam)</a>

            <script>
                // Próba automatycznego przekierowania
                window.location.href = "steam://run/304930//+connect%20${ip}";
                
                // Po kilku sekundach można zamknąć okno, jeśli użytkownik kliknie zezwól
                setTimeout(() => {
                    // window.close(); // Przeglądarki czesto blokuja window.close() bez akcji usera, wiec to tylko opcja
                }, 3000);
            </script>
        </body>
        </html>
    `;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
