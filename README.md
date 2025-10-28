# TODO Web App (Django + FastAPI Monolith)

This is a multi-user, full-stack TODO web application built with a powerful monolithic architecture that combines the strengths of Django and FastAPI. The backend serves a secure, token-authenticated RESTful API built with FastAPI for high performance, while leveraging Django's robust ORM and authentication system. The frontend is a dynamic single-page application built with vanilla HTML, CSS, and JavaScript that interacts with the protected API endpoints.

## Key Features:

-   *User Authentication & Authorization:* Secure user registration and login system. Tasks are private and can only be accessed by their owner.

-   *Stateless JWT Authentication:* Uses JSON Web Tokens (`djangorestframework-simplejwt`) for secure, stateless API communication.

-   *Hybrid Backend:* Combines FastAPI for fast, asynchronous API endpoints with Django for its powerful ORM, migrations, and admin interface.

-   *Full CRUD Functionality:* The API supports creating, reading, updating, and deleting tasks on a per-user basis.

-   *Asynchronous Operations:* API endpoints use `async`/`await` with `sync_to_async` for non-blocking database operations.

-   **Dynamic Frontend:* A clean, responsive frontend with login/register modals that communicates with the backend without page reloads.

-   *Interactive API Docs:* Automatic, interactive API documentation provided by FastAPI/Swagger UI.

-   *PostgreSQL Database:* Uses a robust PostgreSQL database for data persistence.

## Tech Stack

-   *Backend:* Django, FastAPI, Uvicorn

-   *Authentication:* `djangorestframework-simplejwt`

-   *Database:* PostgreSQL (`psycopg2-binary`)

-   *Form Parsing:* `python-multipart`

-   *Frontend:* HTML5, CSS3, Vanilla JavaScript

-   *API Validation:* Pydantic

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

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
    -   Create a database named `tododb` and a user named `todouser` with the password `password`.
    -   Grant the necessary permissions to the user.
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
    This project must be run with an ASGI server like Uvicorn.
    ```bash
    uvicorn todoproject.asgi:application --reload
    ```
    The application will be running at `http://127.0.0.1:8000`. After starting, you must **register a new account and log in** via the UI to use the application.

---

## API Endpoints

The API is accessible under the `/api/` prefix. Interactive documentation is available at `http://127.0.0.1:8000/api/docs`.

### Authentication Endpoints

| Method | Path                 | Description                                      |
| :----- | :------------------- | :----------------------------------------------- |
| `POST` | `/api/auth/register` | Create a new user account.                       |
| `POST` | `/api/auth/login`    | Log in with username/password (form-data). Returns JWT tokens. |

### Task Endpoints

| Method  | Path                             | Description                  | Authorization Required |
| :------ | :------------------------------- | :--------------------------- | :--------------------- |
| `POST`  | `/api/tasks/`                    | Create a new task.           | **Yes (Bearer Token)** |
| `GET`   | `/api/tasks/`                    | Retrieve a user's tasks.     | **Yes (Bearer Token)** |
| `GET`   | `/api/tasks/{task_id}`           | Retrieve a single task by ID.| **Yes (Bearer Token)** |
| `PUT`   | `/api/tasks/{task_id}`           | Update an existing task.     | **Yes (Bearer Token)** |
| `PATCH` | `/api/tasks/{task_id}`           | Partially update a task.     | **Yes (Bearer Token)** |
| `DELETE`| `/api/tasks/{task_id}`           | Delete a task.               | **Yes (Bearer Token)** |


---

## Project Roadmap

Future enhancements and features planned for the project:

-   [x] *User Authentication:* Implement JWT-based authentication so tasks are tied to specific users.

-   [ ] *Advanced API Filtering:* Add query parameters to filter tasks by priority, completion status, or due date.

-   [ ] *Frontend Enhancements:* Improve the UI/UX, add animations, and sortable task lists.

-   [ ] *Unit & Integration Testing:* Write a comprehensive test suite for the API endpoints.

-   [ ] *Deployment:* Containerize the application with Docker and deploy it.