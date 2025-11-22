# TODO API - Menadżer Zadań

**Autor:** Krzysztof Janik
**Grupa:** [NIE ZNAM GRUPY]
**Data:** 2024-07-25

## Opis projektu
Proste REST API dla menadżera zadań (backend) oraz przykładowy interfejs użytkownika (frontend). Projekt został podzielony na dwa osobne katalogi w celu lepszej organizacji kodu.

## Technologie

### Backend
- Node.js
- Express.js
- JSON (do przechowywania danych)

### Frontend
- HTML
- CSS (Materialize)
- JavaScript

## Instalacja i uruchomienie

### Wymagania
- Node.js 14+
- npm (zazwyczaj instalowany z Node.js)

### Krok po kroku
Backend i frontend uruchamiane są osobno.

#### Uruchomienie Backendu
```bash
# 1. Przejdź do katalogu backendu
cd backend

# 2. Zainstaluj zależności
npm install

# 3. Uruchom serwer backendu
npm start
```
Serwer API będzie dostępny pod adresem: **http://localhost:3000**

#### Uruchomienie Frontendu
Aby uruchomić frontend, wystarczy otworzyć plik `frontend/index.html` w przeglądarce internetowej. Można to zrobić, klikając dwukrotnie na plik lub używając rozszerzenia do serwowania plików statycznych, np. "Live Server" w VS Code.

## Struktura projektu
```
PAWtodo/
├── backend/
│   ├── app.js          # Główny plik serwera Express.js
│   ├── tasks.json      # Plik z danymi
│   └── package.json    # Zależności i skrypty backendu
│
├── frontend/
│   ├── index.html      # Główny plik HTML frontendu
│   └── ...             # (opcjonalnie) pliki CSS i JS dla frontendu
│
├── .gitignore          # Plik ignorujący niepotrzebne pliki w Git
└── README.md           # Ten plik
```

## Endpointy API
Endpointy API pozostają bez zmian i są serwowane przez backend.

### 1. GET /health
Opis: Sprawdza status i działanie API.
```bash
curl http://localhost:3000/health
```

### 2. GET /tasks
Opis: Pobiera listę wszystkich zadań.
```bash
curl http://localhost:3000/tasks
```

### 3. POST /tasks
Opis: Dodaje nowe zadanie do listy.
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Nowe zadanie","description":"Opis"}'
```

### 4. PUT /tasks/:id
Opis: Modyfikuje istniejące zadanie.
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Zaktualizowany","completed":true}'
```
