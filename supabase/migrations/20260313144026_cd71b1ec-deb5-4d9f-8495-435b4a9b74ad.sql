-- Create game_sessions table for multiplayer
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 7),
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'finished')),
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  game_state JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Permissive policies (no auth for now)
CREATE POLICY "Anyone can read game sessions"
  ON public.game_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create game sessions"
  ON public.game_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update game sessions"
  ON public.game_sessions FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();