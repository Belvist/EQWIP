@echo off
echo Starting Ollama service...

REM Проверяем, запущен ли Ollama
netstat -an | findstr 11434 >nul
if %errorlevel% == 0 (
    echo Ollama is already running on port 11434
    goto :check_models
)

REM Запускаем Ollama в фоновом режиме
echo Starting Ollama server...
start /B ollama serve

REM Ждем 5 секунд для запуска
timeout /t 5 /nobreak >nul

:check_models
echo Checking for required models...

REM Проверяем наличие модели qwen2.5:7b-instruct
ollama list | findstr "qwen2.5:7b-instruct" >nul
if %errorlevel% neq 0 (
    echo Pulling qwen2.5:7b-instruct model...
    ollama pull qwen2.5:7b-instruct
)

REM Проверяем наличие модели nomic-embed-text:latest
ollama list | findstr "nomic-embed-text:latest" >nul
if %errorlevel% neq 0 (
    echo Pulling nomic-embed-text:latest model...
    ollama pull nomic-embed-text:latest
)

echo Ollama setup complete!
echo Models available:
ollama list

pause
