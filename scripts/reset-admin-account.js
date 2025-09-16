// Script to reset the admin account to owner role
console.log("Resetting admin account to owner role...")

// Update current user if it's the admin
const currentUser = localStorage.getItem("currentUser")
if (currentUser) {
  const userData = JSON.parse(currentUser)
  if (userData.uid === "admin_settlyfe_com") {
    userData.role = "owner"
    localStorage.setItem("currentUser", JSON.stringify(userData))
    console.log("✅ Current user updated to owner role")
  }
}

// Update all users list
const allUsers = localStorage.getItem("allUsers")
if (allUsers) {
  const usersData = JSON.parse(allUsers)
  const adminIndex = usersData.findIndex((u) => u.uid === "admin_settlyfe_com")
  if (adminIndex !== -1) {
    usersData[adminIndex].role = "owner"
    localStorage.setItem("allUsers", JSON.stringify(usersData))
    console.log("✅ Admin user in allUsers updated to owner role")
  }
} else {
  // Create default users with admin as owner
  const defaultUsers = [
    {
      uid: "admin_settlyfe_com",
      email: "admin@settlyfe.com",
      name: "Admin User",
      role: "owner",
      teamId: "settlyfe",
      createdAt: new Date().toISOString(),
    },
    {
      uid: "user01_settlyfe_com",
      email: "user01@settlyfe.com",
      name: "John Doe",
      role: "member",
      teamId: "settlyfe",
      createdAt: new Date().toISOString(),
    },
    {
      uid: "user02_settlyfe_com",
      email: "user02@settlyfe.com",
      name: "Jane Smith",
      role: "member",
      teamId: "settlyfe",
      createdAt: new Date().toISOString(),
    },
    {
      uid: "user03_settlyfe_com",
      email: "user03@settlyfe.com",
      name: "Mike Johnson",
      role: "member",
      teamId: "settlyfe",
      createdAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem("allUsers", JSON.stringify(defaultUsers))
  console.log("✅ Created default users with admin as owner")
}

// Ensure teams exist
const teams = localStorage.getItem("teams")
if (!teams) {
  const defaultTeams = [
    {
      id: "settlyfe",
      name: "Settlyfe",
      leadUid: "admin_settlyfe_com",
      createdAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem("teams", JSON.stringify(defaultTeams))
  console.log("✅ Created default teams")
}

console.log("🎉 Admin account restoration complete!")
console.log("Please refresh the page to see the changes.")

// Display current admin user info
const updatedCurrentUser = localStorage.getItem("currentUser")
if (updatedCurrentUser) {
  const userData = JSON.parse(updatedCurrentUser)
  console.log("Current user:", userData)
}
