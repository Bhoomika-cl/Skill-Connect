from database import users_collection


username = input("Enter the existing SkillConnect username to make admin: ").strip()
user = users_collection.find_one({"username": username})

if not user:
    print("No account found with that username. Create and sign in to the account first.")
else:
    print(f"Selected account: {user.get('full_name', username)} ({username})")
    confirmation = input("Type MAKE ADMIN to grant admin access: ").strip()
    if confirmation == "MAKE ADMIN":
        users_collection.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
        print("Admin role assigned. Sign out and sign in again to refresh your access.")
    else:
        print("No changes made.")
