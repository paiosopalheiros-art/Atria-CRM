import { AdminSetupForm } from "@/components/admin-setup-form"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AdminSetupForm />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>After creating the admin user, you can access:</p>
          <ul className="mt-2 space-y-1">
            <li>• Admin Dashboard</li>
            <li>• User Management</li>
            <li>• Property Moderation</li>
            <li>• System Configuration</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
