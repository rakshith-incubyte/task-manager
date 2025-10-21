export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome to Task Manager
        </h1>
        <p className="text-lg text-muted-foreground">
          Organize your tasks efficiently and boost your productivity.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <div className="rounded-lg border bg-card p-6 w-64 text-left">
            <h3 className="font-semibold mb-2">Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              View your task overview and statistics
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 w-64 text-left">
            <h3 className="font-semibold mb-2">Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Manage and organize your tasks
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 w-64 text-left">
            <h3 className="font-semibold mb-2">Settings</h3>
            <p className="text-sm text-muted-foreground">
              Customize your preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
