#  DEVRate Compiler Sandbox

Trial web

##  Features

* **Monaco Editor:** A powerful, feature-rich code editor (the same one that powers VS Code) is used for a familiar coding experience.
* **Multi-Language Support:** Easily switch between **Python**, **Java**, and **C++** with initial template code and correct syntax highlighting.
* **Code Execution:** The "▶ Run Code" button sends the code to an assumed **external compiler service** (via a `/api/execute` proxy) and displays the results in the **Output View**.
* **AI Detection Simulation:** The "🤖 AI Check" button simulates an originality scan, providing a visual pass/fail status.
* **File Saving:** The "⬇ Save File" button allows users to download the current editor content as a file with the correct extension (e.g., `.py`, `.java`, `.cpp`).

---

## 🛠️ Technology Stack

This application is primarily a **client-side interface** built using modern web technologies:

* **HTML/CSS:** The base structure and layout.
* **Tailwind CSS:** Used for all styling, providing a fast, utility-first approach.
* **Monaco Editor:** The core component for the code editing experience.
* **JavaScript (Vanilla ES6+):** Used for all front-end logic, including button handlers, language switching, and network calls.

---

The application automatically suggests a file name based on the selected language when clicking "⬇ Save File":

| Language | Monaco ID | Suggested File Extension |
| :--- | :--- | :--- |
| **Python** | `python` | `.py` |
| **Java** | `java` | `.java` |
| **C++** | `cpp` | `.cpp` |
