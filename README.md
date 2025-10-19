[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/a2pucUEo)

# 🎮 Gamer Assistant AI

An AI-powered chat assistant specifically designed for gamers, built with Streamlit and Groq API.

## Features

- 💬 Interactive chat interface
- 🎮 Gaming-focused AI assistant
- ⚡ Fast responses powered by Groq's llama-3.3-70b-versatile model
- 🎨 Clean and user-friendly interface
- 📝 Chat history management

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Key

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Groq API key from [https://console.groq.com/keys](https://console.groq.com/keys)

3. Edit `.env` file and add your API key:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```

### 3. Run the Application

```bash
streamlit run app.py
```

The app will open in your default browser at `http://localhost:8501`

## Usage

- Type your gaming-related questions in the chat input
- Ask about game strategies, tips, recommendations, hardware advice, or troubleshooting
- Use the "Clear Chat History" button in the sidebar to start a new conversation

## What You Can Ask

- Game strategies and walkthroughs
- Game recommendations based on your preferences
- Gaming hardware and setup advice
- Troubleshooting gaming issues
- Gaming news and trends
- Tips for improving gameplay

## Technologies Used

- **Streamlit**: Web interface framework
- **Groq API**: AI model provider (llama-3.3-70b-versatile)
- **Python-dotenv**: Environment variable management

## License

MIT License
