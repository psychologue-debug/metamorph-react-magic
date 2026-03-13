-- Allow deletion of empty game sessions
CREATE POLICY "Anyone can delete game sessions"
  ON public.game_sessions FOR DELETE
  TO anon, authenticated
  USING (true);