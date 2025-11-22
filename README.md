# TODO API - Menadżer Zadań

**Autor:** [Twoje Imię]
**Grupa:** [Numer grupy]
**Data:** 2024-07-25

## Opis projektu
Proste REST API dla menadżera zadań, które pozwala na przeglądanie, dodawanie i modyfikowanie zadań. Dane są zapisywane w pliku `tasks.json` na serwerze.

## Technologie
- Node.js
- Express.js
- JSON (do przechowywania danych)

## Instalacja i uruchomienie

### Wymagania
- Node.js 14+
- npm (zazwyczaj instalowany z Node.js)

### Krok po kroku
```bash
# 1. Sklonuj repozytorium
git clone [URL_TWOJEGO_REPO]

# 2. Przejdź do katalogu
cd PAWtodo

# 3. Zainstaluj zależności
npm install

# 4. Uruchom serwer
npm start
```
Serwer powinien być dostępny pod adresem: **http://localhost:3000**

## Endpointy API

### 1. GET /health
Opis: Sprawdza status i działanie API.
Przykład użycia:
```bash
curl http://localhost:3000/health
```
Przykładowa odpowiedź:
```json
{
  "status": "OK",
  "timestamp": "2024-07-25T10:30:00Z"
}
```

### 2. GET /tasks
Opis: Pobiera listę wszystkich zadań.
Przykład użycia:
```bash
curl http://localhost:3000/tasks
```
Przykładowa odpowiedź:
```json
[
  {
    "id": 1,
    "title": "Zrobić zakupy",
    "description": "Mleko, chleb, masło",
    "completed": false,
    "createdAt": "2024-07-25T10:00:00Z"
  }
]
```

### 3. POST /tasks
Opis: Dodaje nowe zadanie do listy.
Przykład użycia:
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Nowe zadanie","description":"Opis nowego zadania"}'
```
Przykładowa odpowiedź (201 Created):
```json
{
  "id": 2,
  "title": "Nowe zadanie",
  "description": "Opis nowego zadania",
  "completed": false,
  "createdAt": "2024-07-25T12:00:00Z"
}
```

### 4. PUT /tasks/:id
Opis: Modyfikuje istniejące zadanie o podanym ID.
Przykład użycia:
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Zaktualizowany tytuł","completed":true}'
```
Przykładowa odpowiedź (200 OK):
```json
{
  "id": 1,
  "title": "Zaktualizowany tytuł",
  "description": "Mleko, chleb, masło",
  "completed": true,
  "createdAt": "2024-07-25T10:00:00Z",
  "updatedAt": "2024-07-25T13:00:00Z"
}
```
W przypadku braku zadania serwer odpowie kodem 404 Not Found.

## Testowanie
API zostało przetestowane ręcznie przy użyciu narzędzia `curl` w terminalu w celu weryfikacji działania wszystkich endpointów zgodnie z wymaganiami.

## Struktura projektu
```
PAWtodo/
├── app.js          # Główny plik serwera Express.js
├── tasks.json      # Plik z danymi (tworzony automatycznie)
├── package.json    # Definicje projektu i zależności
├── README.md       # Ten plik
└── .gitignore      # Plik ignorujący niepotrzebne pliki w Git
```
