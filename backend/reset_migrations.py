import os
import sys
import shutil
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def confirm_action():
    """Confirm the action with the user"""
    print("WARNING: This will completely reset your database and all migrations.")
    print("All data will be lost.")
    response = input("Are you sure you want to continue? (yes/no): ")
    return response.lower() in ('yes', 'y')

def delete_database():
    """Delete the SQLite database file"""
    db_path = os.path.join(BASE_DIR, 'db.sqlite3')
    if os.path.exists(db_path):
        print(f"Deleting database file: {db_path}")
        os.remove(db_path)
        print("Database file deleted.")
    else:
        print("No database file found.")

def clean_migration_files(app):
    """Clean migration files for a specific app"""
    migration_dir = os.path.join(BASE_DIR, app, 'migrations')
    if os.path.exists(migration_dir):
        print(f"Cleaning migration files for {app}")
        for item in os.listdir(migration_dir):
            item_path = os.path.join(migration_dir, item)
            if os.path.isfile(item_path) and item != '__init__.py' and item.endswith('.py'):
                os.remove(item_path)
                print(f"  Deleted {item}")
            elif os.path.isdir(item_path) and item == '__pycache__':
                shutil.rmtree(item_path)
                print(f"  Deleted {item}/ directory")
    else:
        print(f"No migration directory found for {app}")

def main():
    """Main function to reset the migrations"""
    if not confirm_action():
        print("Operation cancelled.")
        return
    
    delete_database()
    
    apps = ['users', 'events']
    for app in apps:
        clean_migration_files(app)
    
    print("\nResetting complete. Now run the following commands:")
    print("1. python manage.py makemigrations users")
    print("2. python manage.py makemigrations events")
    print("3. python manage.py migrate")
    print("4. python manage.py createsuperuser")

if __name__ == "__main__":
    main()
