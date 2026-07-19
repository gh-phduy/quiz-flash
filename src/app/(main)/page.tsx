import { createClient } from '@/utils/supabase/server';
import ModeSelector from './mode-selector';
import { 
  Layers, 
  RefreshCw, 
  FileText, 
  Grid2X2, 
  Rocket, 
  Copy 
} from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let sets: any[] = [];
  
  if (user) {
    const { data, error } = await supabase
      .from('sets')
      .select('*, cards(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      sets = data;
    }
  }

  const modes = [
    { name: "Flashcards", icon: <Layers className="text-blue-400 w-5 h-5" />, href: "/flashcards" },
    { name: "Learn", icon: <RefreshCw className="text-indigo-400 w-5 h-5" />, href: "/learn" },
    { name: "Test", icon: <FileText className="text-blue-400 w-5 h-5" />, href: "/test" },
    { name: "Blocks", icon: <Grid2X2 className="text-blue-500 w-5 h-5" />, href: "/blocks" },
    { name: "Blast", icon: <Rocket className="text-blue-400 w-5 h-5" />, href: "/blast" },
    { name: "Match", icon: <Copy className="text-indigo-300 w-5 h-5" />, href: "/match" },
  ];

  return (
    <main className="flex flex-col items-center justify-center p-4 sm:p-8 min-h-[calc(100vh-64px)] bg-background text-foreground font-sans">
      <ModeSelector modes={modes} sets={sets} />
    </main>
  );
}
