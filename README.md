# Go To-Do List Application

A simple and modern To-Do List web application built with Go and SQLite.

## Features

- Create, read, update, and delete todo items
- Mark todos as complete/incomplete
- Clean and responsive user interface
- SQLite database for data persistence

## Prerequisites

- Go 1.21 or higher
- SQLite3

## Setup and Running

1. Clone the repository
2. Install dependencies:
   ```bash
   go mod download
   ```
3. Run the application:
   ```bash
   go run main.go
   ```
4. Open your browser and navigate to `http://localhost:8080`

## Project Structure

- `main.go` - Application entry point
- `models/` - Data models
- `handlers/` - HTTP request handlers
- `database/` - Database operations
- `static/` - Static files (CSS, JavaScript)
- `templates/` - HTML templates
