import crestImage from "@/assets/broomfield-crest.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-8">
          <img 
            src={crestImage} 
            alt="Broomfield Family Crest" 
            className="w-64 h-64 object-contain"
          />
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-foreground">
              Welcome to Your Dashboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Manage your financial connections, track transactions, and organise your recipes all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
