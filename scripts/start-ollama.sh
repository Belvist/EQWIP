#!/bin/bash

echo "Starting Ollama service..."

# Проверяем, запущен ли Ollama
if netstat -tuln | grep -q ":11434 "; then
    echo "Ollama is already running on port 11434"
else
    echo "Starting Ollama server..."
    ollama serve &
    sleep 5
fi

echo "Checking for required models..."

# Проверяем наличие модели qwen2.5:7b-instruct
if ! ollama list | grep -q "qwen2.5:7b-instruct"; then
    echo "Pulling qwen2.5:7b-instruct model..."
    ollama pull qwen2.5:7b-instruct
fi

# Проверяем наличие модели nomic-embed-text:latest
if ! ollama list | grep -q "nomic-embed-text:latest"; then
    echo "Pulling nomic-embed-text:latest model..."
    ollama pull nomic-embed-text:latest
fi

echo "Ollama setup complete!"
echo "Models available:"
ollama list
