import { redirect } from "next/navigation";

export default function HomePage() {
  // This will automatically send the user to the /dashboard route
  redirect("/dashboard");
}
