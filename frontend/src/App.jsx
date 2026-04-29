function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-accent">
          Sentinel Log
        </h1>
        <p className="text-xl text-slate-400">
          Enterprise Log Aggregation & Observability Platform
        </p>
        <div className="p-6 rounded-2xl bg-card border border-slate-800 shadow-2xl">
          <p className="text-slate-300">
            Welcome to the Sentinel Dashboard. Initializing system metrics...
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
