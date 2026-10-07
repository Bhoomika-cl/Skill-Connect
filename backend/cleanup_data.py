from database import (
    users_collection,
    profiles_collection,
    skills_collection,
    projects_collection,
)


def cleanup_all_data():
    print("\n======================================")
    print("   SKILLCONNECT DATABASE CLEANUP")
    print("======================================\n")

    users_result = users_collection.delete_many({})
    profiles_result = profiles_collection.delete_many({})
    skills_result = skills_collection.delete_many({})
    projects_result = projects_collection.delete_many({})

    print(f"Users deleted:    {users_result.deleted_count}")
    print(f"Profiles deleted: {profiles_result.deleted_count}")
    print(f"Skills deleted:   {skills_result.deleted_count}")
    print(f"Projects deleted: {projects_result.deleted_count}")

    print("\n======================================")
    print("   CLEANUP COMPLETED")
    print("======================================")
    print("\nAll SkillConnect users and related data")
    print("have been removed from MongoDB.\n")


if __name__ == "__main__":
    confirmation = input(
        "This will DELETE ALL users, profiles, skills and projects. "
        "Type DELETE to continue: "
    )

    if confirmation.strip() == "DELETE":
        cleanup_all_data()
    else:
        print("\nCleanup cancelled.")