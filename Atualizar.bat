@echo off
color 0A
title Atualizador - Extensao Processo Digital
echo ===================================================
echo   Baixando atualizacao do GitHub (ZIP)...
echo ===================================================
echo.

:: 1. Cria uma pasta temporaria para o download
if exist temp_update rmdir /s /q temp_update
mkdir temp_update

:: 2. Baixa o ZIP usando .WebClient (Evita travamentos e alertas do PowerShell)
powershell -Command "(New-Object System.Net.WebClient).DownloadFile('https://github.com/nicoalsdev/Extens-o-Processo-Digital---Praia-Grande/archive/refs/heads/main.zip', 'temp_update\update.zip')"

echo Extraindo arquivos...

:: 3. Descompacta o ZIP na pasta temporaria
powershell -Command "Expand-Archive -Path 'temp_update\update.zip' -DestinationPath 'temp_update' -Force"

echo Substituindo arquivos da extensao...

:: 4. Copia os arquivos de dentro da pasta extraida para a raiz (substituindo os antigos)
xcopy /E /Y "temp_update\Extens-o-Processo-Digital---Praia-Grande-main\*" "%~dp0"

:: 5. Limpa os arquivos temporarios
rmdir /s /q temp_update

echo.
echo ===================================================
echo  ATUALIZACAO CONCLUIDA COM SUCESSO!
echo  Va na pagina chrome://extensions/ e clique no
echo  botao (Recarregar) no card da extensao.
echo ===================================================
echo.
pause