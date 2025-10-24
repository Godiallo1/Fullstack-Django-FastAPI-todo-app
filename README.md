# TODO Web App (Django + FastAPI Monolith)

This is a full-stack TODO web application built with a powerful monolithic architecture that combines the strengths of Django and FastAPI. The backend serves a RESTful API built with FastAPI for high performance, while leveraging Django's robust ORM for database interactions. The frontend is a simple, dynamic single-page application built with vanilla HTML, CSS, and JavaScript.

## Key Features

-   *Hybrid Backend:* Uses FastAPI for creating fast, asynchronous API endpoints and Django for its powerful ORM, migrations, and admin interface.

-   *Full CRUD Functionality:* The API supports creating, reading, updating, and deleting tasks.

-   *Asynchronous Operations:* API endpoints use `async`/`await` with `sync_to_async` for non-blocking database operations.

-   *Dynamic Frontend:* A clean, responsive frontend built with vanilla JavaScript that communicates with the backend without page reloads.

-   *Interactive API Docs:* Automatic, interactive API documentation provided by FastAPI/Swagger UI.

-   *PostgreSQL Database:* Uses a robust PostgreSQL database for data persistence.

## Tech Stack

-   *Backend:* Django, FastAPI, Uvicorn

-   *Database:* PostgreSQL (`psycopg2-binary`)

-   *Frontend:* HTML5, CSS3, Vanilla JavaScript

-   *API Validation:* Pydantic

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Python 3.8+
-   PostgreSQL installed and running
-   Git

### Installation and Setup

1.  *Clone the repository:*
    ```bash
    git clone [YOUR_REPOSITORY_URL]
    cd [your-project-folder]
    ```

2.  *Create and activate a virtual environment:*
    ```bash
    # Create the virtual environment
    python -m venv venv

    # Activate it
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  *Install the dependencies:*
    ```bash
    pip install -r requirements.txt
    ```

4.  *Configure the PostgreSQL Database:*
    -   Make sure your PostgreSQL server is running.
    -   Create a database named `tododb`.
    -   Create a user named `todouser` with the password `password`.
    -   Grant the necessary permissions to the user for the database.
    ```sql
    -- Example SQL commands
    CREATE DATABASE tododb;
    CREATE USER todouser WITH PASSWORD 'password';
    GRANT ALL PRIVILEGES ON DATABASE tododb TO todouser;
    GRANT CREATE ON SCHEMA public TO todouser;
    ```
    *(Note: The credentials are in `todoproject/settings.py`)*

5.  *Run the database migrations:*
    ```bash
    python manage.py migrate
    ```

6.  *Run the ASGI server:*
    This project must be run with an ASGI server like Uvicorn, not Django's `runserver`.
    ```bash
    uvicorn todoproject.asgi:application --reload
    ```
    The application will be running at `http://127.0.0.1:8000`.

---

## API Endpoints

The API is accessible under the `/api/` prefix. Interactive documentation is available at `http://127.0.0.1:8000/api/docs`.

| Method  | Path                             | Description                  |
| :------ | :------------------------------- | :--------------------------- |
| `POST`  | `/api/tasks/`                    | Create a new task.           |
| `GET`   | `/api/tasks/`                    | Retrieve a list of all tasks.|
| `GET`   | `/api/tasks/{task_id}`           | Retrieve a single task by ID.|
| `PUT`   | `/api/tasks/{task_id}`           | Update an existing task.     |
| `DELETE`| `/api/tasks/{task_id}`           | Delete a task.               |
| `PATCH` | `/api/tasks/{task_id}/complete`  | Mark a task as complete.     |


---

## Project Roadmap

Future enhancements and features planned for the project:

-   [ ] *User Authentication:* Implement JWT-based authentication so tasks are tied to specific users.

-   [ ] *Advanced API Filtering:* Add query parameters to filter tasks by priority, completion status, or due date.

-   [ ] *Frontend Enhancements:* Improve the UI/UX, add animations, and sortable task lists.

-   [ ] *Unit & Integration Testing:* Write a comprehensive test suite for the API endpoints.

--   [ ] *Deployment:* Containerize the application with Docker and deploy it.