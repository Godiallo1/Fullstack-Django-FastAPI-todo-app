import sys
import py_compile

files = [
    'c:/Users/USER/Desktop/my-todo-app/todoproject/todo/views.py',
    'c:/Users/USER/Desktop/my-todo-app/todoproject/todoproject/urls.py'
]

for file in files:
    try:
        py_compile.compile(file, doraise=True)
        print(f"SUCCESS: {file} passed syntax check.")
    except Exception as e:
        print(f"FAILURE: {file} failed syntax check: {e}")
        sys.exit(1)
