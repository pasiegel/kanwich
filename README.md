# Kanwich 🥪

> [!TIP]
> David bet me a dollar I couldn't build a full Trello-style Kanban app —
> boards, drag-and-drop, a desktop app for Windows/Mac/Linux, the works.
> This repo is that dollar. Read on to see what you're using, David.

A Kanban board (like Trello) that lives entirely on your own device. No
account, no server, no subscription — everything is stored locally, and
the only way your data leaves is a file *you* choose to export.

[![Windows](https://img.shields.io/badge/Windows-Download-0078D6?logo=windows&logoColor=white)](../../releases/latest)
[![macOS](https://img.shields.io/badge/macOS-Download-000000?logo=apple&logoColor=white)](../../releases/latest)
[![Linux](https://img.shields.io/badge/Linux-Download-FCC624?logo=linux&logoColor=black)](../../releases/latest)
[![PWA](https://img.shields.io/badge/Web-Use%20in%20browser-F59E0B?logo=googlechrome&logoColor=white)](#-try-it-in-a-browser)

## 🥪 Why "Kanwich"?

"Kanban" literally means *signboard* — like the sandwich board outside a
deli. Kanban + sandwich = **Kanwich**. It also just sounds like something
you'd order.

## 🚀 Getting started

> [!NOTE]
> No install needed to try it — Kanwich also runs as a website. See
> **[TECHNICAL.md](TECHNICAL.md)** for hosting it yourself (GitHub Pages
> or a local Apache server) if that link isn't live yet.

### 🖥️ Desktop app

Grab an installer for your OS from the badges above (or the
[Releases page](../../releases)), install it, and open it like any other
app. No setup, no login screen.

### 🌐 Try it in a browser

Open `index.html` from a local build, or visit the hosted version once
it's deployed (see the technical README). Works offline once loaded, and
you can "Install" it from your browser's address bar like any other PWA.

## 🎯 What it does

| Feature | Details |
|:---|:---|
| **Boards & columns** | As many boards as you want, each with its own columns (To Do / In Progress / Done, or whatever you rename them to) — give a board a description and cover image too |
| **Drag & drop** | Reorder cards, move them between columns, reorder columns themselves — columns stack vertically on mobile instead of scrolling sideways |
| **Cards** | Description, a subtask checklist, colored labels, a due date, and a cover image |
| **Export All / Import** | One JSON file with everything — how you back up your boards or move them to a new PC |
| **Export board → HTML** | Turn a single board into a standalone, read-only HTML page you can email or post anywhere — no app required to view it |
| **Dark mode** | Because of course |
| **Sound effects** | Silly synthesized blips for creating/deleting things — toggle next to dark mode. See below. |
| **Installable (PWA)** | Add it to your phone's home screen or desktop, works offline |
| **Desktop app** | Native Windows/macOS/Linux app with real Save/Open dialogs |

> [!NOTE]
> 🔊 **The sound effects were David's idea**, in true "well now you have
> to add THAT too" fashion. They're tiny synthesized blips — a cheerful
> little arpeggio for a new board, a boop for a new card, a comedic
> "womp womp" for deleting something. There's a mute toggle right next to
> the dark mode button for exactly the moment you decide you've had
> enough of them, which, statistically, will be soon. No hard feelings,
> David.

> [!IMPORTANT]
> Your boards live in *this browser* (or *this desktop app install*) —
> nothing syncs automatically between devices. Use **Export All**
> regularly, especially before clearing browser data or switching
> machines, and **Import** it back wherever you want your boards next.

## 🧭 Quick tour

1. **Create a board** from the dashboard.
2. **Add columns and cards** — click a card to open it and add a
   description, subtasks, labels, a due date, or a cover image.
3. **Drag cards** between columns as work moves along.
4. **Share a board** — open it, hit **Export board**, and send the
   resulting HTML file to anyone. They don't need Kanwich installed.
5. **Back up everything** — from the dashboard, **Export All** saves one
   JSON file with every board. **Import** restores it (here or on another
   device).

## 🤓 Want the technical details?

Architecture, scripts, CI/CD, and the Electron build all live in
**[TECHNICAL.md](TECHNICAL.md)**.

---

<sub>David — pay up. 😄</sub>
