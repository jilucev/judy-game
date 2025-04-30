# Judy's Shark Adventure

A fun browser-based game where you play as Judy the Shark, jumping over cats while avoiding raining cats from the sky!

## How to Run the Game

1. **Download and Extract**
   - Download the zip file containing the game
   - Extract it to a location on your computer

2. **Start a Local Web Server**
   Choose one of these methods:

   **Python (Recommended)**
   - Open a terminal/command prompt
   - Navigate to the game directory:
     ```bash
     cd path/to/judy-game
     ```
   - If you have Python 3 installed, run:
     ```bash
     # On macOS/Linux:
     python3 -m http.server 8000

     # On Windows:
     python -m http.server 8000
     ```
   - Open your web browser and go to: `http://localhost:8000`

   **Alternative Methods**
   - If you have Node.js installed, you can use:
     ```bash
     npx http-server
     ```
   - If you have PHP installed:
     ```bash
     php -S localhost:8000
     ```

3. **Play the Game**
   - Use the SPACE bar to make Judy jump
   - Jump over the cat obstacles
   - Watch out for raining cats!
   - Try to get the highest score

## Game Features
- Judy the Shark as the main character
- Rotating cat obstacles
- Raining cats that appear every 5 seconds
- Sound effects including background music and loud meows
- Score tracking based on successful jumps

## Files Included
- `index.html` - The main game page
- `game.js` - The game logic
- `images/` - Directory containing game images
  - JudyShark.png
  - kitton_one.png
  - kitton_two.png
- `audio/` - Directory containing game sounds
  - background.m4a
  - score.m4a
  - start.m4a
  - meow.m4a

## Why a Web Server is Needed
The game needs to be served through a web server because modern browsers restrict loading audio and images directly from the file system for security reasons. Using a local web server ensures all game assets load correctly.

## Troubleshooting
- If you see "Could not find canvas element" error, make sure you're accessing the game through a web server (http://localhost:8000) and not directly opening the HTML file
- If you don't hear sounds, check that your browser allows audio playback
- If the server says "address already in use", try a different port number (e.g., 8080 or 3000) # judy-game
