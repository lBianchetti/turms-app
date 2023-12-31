const menu = [
  {
    title: "Dashboard",
    path: "/dashboard",
  },
  {
    title: "Add Product",
    path: "/add-product",
  },
  {
    title: "Account",
    children: [
      {
        title: "Profile",
        path: "/profile",
      },
      {
        title: "Edit Profile",
        path: "/edit-profile",
      },
    ],
  },
  {
    title: "Report Bug",
    path: "/contact-us",
  },
];

export default menu;